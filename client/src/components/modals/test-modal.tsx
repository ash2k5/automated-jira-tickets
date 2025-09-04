import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunTest: (subject: string, body: string) => Promise<void>;
  isLoading?: boolean;
}

export default function TestModal({ isOpen, onClose, onRunTest, isLoading }: TestModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    
    try {
      await onRunTest(subject, body);
      setSubject("");
      setBody("");
      onClose();
    } catch (error) {
      console.error("Test failed:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg" data-testid="modal-test">
        <DialogHeader>
          <DialogTitle>Test Email Processing</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="test-subject" className="block text-sm font-medium text-card-foreground mb-2">
              Test Email Subject
            </Label>
            <Input
              id="test-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter test subject..."
              required
              data-testid="input-test-subject"
            />
          </div>
          
          <div>
            <Label htmlFor="test-body" className="block text-sm font-medium text-card-foreground mb-2">
              Test Email Body
            </Label>
            <Textarea
              id="test-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter test email body..."
              className="h-32 resize-none"
              required
              data-testid="textarea-test-body"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !subject.trim() || !body.trim()}
              data-testid="button-run-test"
            >
              {isLoading ? "Running..." : "Run Test"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
