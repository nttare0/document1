import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  ExternalLink, 
  FileText, 
  X,
  Eye,
  Edit3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import zeolfLogo from "@/assets/zeolf-logo.jpg";

type Document = {
  id: string;
  name: string;
  originalName: string;
  description: string | null;
  category: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  documentCode: string | null;
  createdAt: string;
  uploadedBy: string;
  content: string | null;
  recipientInfo: string | null;
  folderId: string | null;
  updatedAt: string;
  metadata: string | null;
  isTemplate: boolean | null;
};

interface DocumentViewerModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewerModal({ 
  document, 
  isOpen, 
  onClose 
}: DocumentViewerModalProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!document) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.originalName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      
      toast({
        title: "Download Complete",
        description: `${document.originalName} has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEdit = () => {
    // For local editing, we'll download the file and show instructions
    handleDownload();
    toast({
      title: "Edit in Local Software",
      description: `The file has been downloaded. Open with ${getRecommendedApp(document.fileType)} to edit locally.`,
    });
  };

  const handleView = async () => {
    try {
      // Open document in a new tab for viewing
      window.open(`/api/documents/${document.id}/view`, '_blank');
    } catch (error) {
      toast({
        title: "View Failed",
        description: "Failed to open document for viewing.",
        variant: "destructive",
      });
    }
  };

  const getRecommendedApp = (fileType: string): string => {
    const type = fileType.toLowerCase();
    if (type.includes('word') || type.includes('document')) return 'Microsoft Word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'Microsoft Excel';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'Microsoft PowerPoint';
    if (type.includes('pdf')) return 'PDF Reader';
    return 'appropriate application';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="document-viewer-modal">
        {/* Header with ZEOLF Logo */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <div className="flex items-center gap-4">
            <img 
              src={zeolfLogo} 
              alt="ZEOLF Logo" 
              className="h-12 w-auto object-contain"
              data-testid="zeolf-logo"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ZEOLF Document Management System
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Secure Document Viewing & Management Platform
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            data-testid="close-viewer-button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Document Information */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2" data-testid="document-title">
            <FileText className="h-5 w-5 text-blue-600" />
            {document.name}
          </DialogTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" data-testid="document-category">
              {document.category}
            </Badge>
            <Badge variant="outline" data-testid="document-type">
              {document.fileType}
            </Badge>
            <Badge variant="outline" data-testid="document-size">
              {formatFileSize(document.fileSize)}
            </Badge>
            {document.documentCode && (
              <Badge variant="outline" data-testid="document-code">
                Code: {document.documentCode}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Document Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            {document.description && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300" data-testid="document-description">
                  {document.description}
                </p>
              </div>
            )}
            
            {document.content && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Content Preview</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300" data-testid="document-content">
                    {document.content}
                  </pre>
                </div>
              </div>
            )}

            {document.recipientInfo && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Recipient Information</h3>
                <p className="text-gray-700 dark:text-gray-300" data-testid="recipient-info">
                  {document.recipientInfo}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Original Filename:</span>
                <p className="text-gray-700 dark:text-gray-300" data-testid="original-filename">
                  {document.originalName}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Created:</span>
                <p className="text-gray-700 dark:text-gray-300" data-testid="creation-date">
                  {formatDate(document.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-b">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={handleView}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              data-testid="view-document-button"
            >
              <Eye className="h-4 w-4" />
              View Document
            </Button>
            
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="download-document-button"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
            
            <Button 
              onClick={handleEdit}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="edit-document-button"
            >
              <Edit3 className="h-4 w-4" />
              Edit in {getRecommendedApp(document.fileType)}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            Click "Edit" to download and open with your local software ({getRecommendedApp(document.fileType)})
          </p>
        </div>

        {/* Footer with ZEOLF Branding */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-b-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  ZEOLF Organization
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Headquarters: Dubai, United Arab Emirates
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white" data-testid="file-number">
                File No: {document.documentCode || document.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Generated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}