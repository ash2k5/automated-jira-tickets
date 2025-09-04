import axios from 'axios';
import { storage } from '../storage';

export interface JiraTask {
  id: string;
  key: string;
  url: string;
}

export class JiraService {
  private async getConfig() {
    const config = await storage.getSystemConfig();
    if (!config) {
      throw new Error('System configuration not found');
    }
    return config;
  }

  private getAuthHeader(): string {
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraApiToken = process.env.JIRA_API_TOKEN;
    
    if (!jiraEmail || !jiraApiToken) {
      throw new Error('JIRA_EMAIL and JIRA_API_TOKEN environment variables are required');
    }

    const auth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');
    return `Basic ${auth}`;
  }

  async createTask(subject: string, body: string, fromEmail: string): Promise<JiraTask> {
    try {
      const config = await this.getConfig();
      
      const issueData = {
        fields: {
          project: {
            key: config.jiraProjectKey
          },
          summary: subject,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `From: ${fromEmail}`,
                    marks: [{ type: 'strong' }]
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `Date: ${new Date().toISOString()}`,
                    marks: [{ type: 'strong' }]
                  }
                ]
              },
              {
                type: 'rule'
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Email Content:'
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: body || 'No content'
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: config.jiraIssueType
          }
        }
      };

      const response = await axios.post(
        `${config.jiraUrl}/rest/api/3/issue`,
        issueData,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 201) {
        throw new Error(`Failed to create Jira task: ${response.statusText}`);
      }

      const jiraResponse = response.data;
      
      return {
        id: jiraResponse.id,
        key: jiraResponse.key,
        url: `${config.jiraUrl}/browse/${jiraResponse.key}`
      };

    } catch (error) {
      console.error('Jira API error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Jira API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const config = await this.getConfig();
      
      const response = await axios.get(
        `${config.jiraUrl}/rest/api/3/myself`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        return {
          success: true,
          user: response.data
        };
      } else {
        return {
          success: false,
          error: `Connection failed: ${response.statusText}`
        };
      }

    } catch (error) {
      console.error('Jira connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const jiraService = new JiraService();
