import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Save, 
  FileText,
  File,
  FileSpreadsheet,
  Presentation,
  Loader2
} from "lucide-react";
import { Document } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import zeolfLogo from "@/assets/zeolf-logo.jpg";

const fileTypeIcons = {
  pdf: { icon: FileText, color: "text-red-600", bgColor: "bg-red-100" },
  word: { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100" },
  excel: { icon: FileSpreadsheet, color: "text-green-600", bgColor: "bg-green-100" },
  powerpoint: { icon: Presentation, color: "text-orange-600", bgColor: "bg-orange-100" },
  unknown: { icon: File, color: "text-gray-600", bgColor: "bg-gray-100" },
};

export default function DocumentEditorPage() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const documentId = params.id;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    recipientInfo: "",
  });

  const { data: document, isLoading } = useQuery<Document>({
    queryKey: ["/api/documents", documentId],
    enabled: !!documentId,
  });

  // Populate form when document loads
  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name || "",
        description: document.description || "",
        content: document.content || "",
        recipientInfo: document.recipientInfo || "",
      });
    }
  }, [document]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Document>) => {
      const res = await apiRequest("PATCH", `/api/documents/${documentId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", documentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document Updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    if (document?.folderId) {
      setLocation(`/folders/${document.folderId}`);
    } else {
      setLocation("/");
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      name: formData.name,
      description: formData.description || null,
      content: formData.content || null,
      recipientInfo: formData.recipientInfo || null,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zeolf-bg">
        <div className="bg-white border-b border-gray-200 p-4">
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-zeolf-bg flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zeolf-text mb-2">Document not found</h2>
          <p className="text-zeolf-text-secondary mb-6">
            The document you're trying to edit doesn't exist or you don't have access to it.
          </p>
          <Button onClick={handleBack} className="bg-zeolf-blue hover:bg-zeolf-blue-dark">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  const fileTypeConfig = fileTypeIcons[document.fileType as keyof typeof fileTypeIcons] || fileTypeIcons.unknown;
  const Icon = fileTypeConfig.icon;

  return (
    <div className="min-h-screen bg-zeolf-bg" data-testid="document-editor">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 ${fileTypeConfig.bgColor} rounded flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${fileTypeConfig.color}`} />
              </div>
              <div>
                <h1 className="font-medium text-zeolf-text" data-testid="document-title">
                  Edit: {document.name}
                </h1>
                <p className="text-sm text-zeolf-text-secondary">
                  Document Editor
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-zeolf-blue hover:bg-zeolf-blue-dark"
              data-testid="button-save"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* ZEOLF Header */}
          <Card className="mb-6">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src={zeolfLogo} 
                    alt="ZEOLF Logo" 
                    className="h-12 w-auto object-contain"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      ZEOLF Document Editor
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Professional Document Management Platform
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {document.category.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Document Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="document-name">Document Name</Label>
                <Input
                  id="document-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter document name"
                  data-testid="input-document-name"
                />
              </div>
              
              <div>
                <Label htmlFor="document-description">Description</Label>
                <Textarea
                  id="document-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter document description (optional)"
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Content */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Document Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="document-content">Content</Label>
                  <Textarea
                    id="document-content"
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    placeholder="Enter document content..."
                    rows={10}
                    className="font-mono text-sm"
                    data-testid="textarea-content"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipient Information (for letters/memos) */}
          {(document.category === "internal_letters" || document.category === "memos") && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Recipient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="recipient-info">Recipient Details</Label>
                  <Textarea
                    id="recipient-info"
                    value={formData.recipientInfo}
                    onChange={(e) => handleInputChange("recipientInfo", e.target.value)}
                    placeholder="Enter recipient information (name, title, address, etc.)"
                    rows={4}
                    data-testid="textarea-recipient-info"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ZEOLF Footer */}
          <Card>
            <CardContent className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ZEOLF Organization
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Headquarters: Dubai, United Arab Emirates
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    File No: {document.documentCode || document.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Last Modified: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}