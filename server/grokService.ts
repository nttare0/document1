import OpenAI from "openai";

const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY || "sk-dummy-key-development"
});

export interface TemplateRequest {
  documentType: string;
  title: string;
  fileType: string;
  recipientInfo?: {
    name?: string;
    address?: string;
    title?: string;
  };
  isInternal?: boolean;
}

export interface ResearchRequest {
  topic: string;
  documentType: string;
  context?: string;
}

export class GrokService {
  async generateDocumentTemplate(request: TemplateRequest): Promise<string> {
    try {
      // If no real API key is available, return a placeholder template
      if (!process.env.XAI_API_KEY || process.env.XAI_API_KEY === "sk-dummy-key-development") {
        return this.getPlaceholderTemplate(request);
      }
      
      const prompt = this.buildTemplatePrompt(request);
      
      const response = await openai.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "You are an expert document creation assistant for ZEOLF technology company. Generate professional business documents with proper formatting, headers, and structure."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Error generating template:", error);
      return this.getPlaceholderTemplate(request);
    }
  }

  async performResearch(request: ResearchRequest): Promise<string> {
    try {
      // If no real API key is available, return a placeholder research
      if (!process.env.XAI_API_KEY || process.env.XAI_API_KEY === "sk-dummy-key-development") {
        return `Research for "${request.topic}" (${request.documentType})
        
[AI research is not available in development mode]

Key Points to Consider:
• Industry best practices for ${request.documentType} documents
• Relevant regulations and compliance requirements
• Current market trends and statistics
• Professional standards and formatting guidelines

${request.context ? `Context Notes: ${request.context}` : ''}

Please configure AI integration to get comprehensive research results.`;
      }

      const prompt = `Research the topic "${request.topic}" for a ${request.documentType} document. 
                     ${request.context ? `Additional context: ${request.context}` : ''}
                     
                     Provide comprehensive, factual information that would be useful for creating this document. 
                     Include key points, statistics if relevant, and industry best practices.`;

      const response = await openai.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "You are a research assistant specializing in business documentation. Provide accurate, well-structured research information."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.5,
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Error performing research:", error);
      return `Research for "${request.topic}" (${request.documentType})
      
[Error occurred during AI research]

Please check your AI configuration and try again.`;
    }
  }

  async improveDocumentContent(content: string, documentType: string): Promise<string> {
    try {
      // If no real API key is available, return the original content with a note
      if (!process.env.XAI_API_KEY || process.env.XAI_API_KEY === "sk-dummy-key-development") {
        return `${content}

---
[AI content improvement is not available in development mode. The original content is displayed above.]`;
      }

      const prompt = `Review and improve the following ${documentType} document content. 
                     Enhance clarity, professionalism, and structure while maintaining the original intent:
                     
                     ${content}`;

      const response = await openai.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "You are a professional document editor. Improve document quality while preserving the original message and intent."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      return response.choices[0].message.content || content;
    } catch (error) {
      console.error("Error improving content:", error);
      return `${content}

---
[Error occurred during AI content improvement. Original content displayed above.]`;
    }
  }

  private buildTemplatePrompt(request: TemplateRequest): string {
    const { documentType, title, fileType, recipientInfo, isInternal } = request;
    
    let prompt = `Create a professional ${documentType} template with the following specifications:
    
    - Document Title: ${title}
    - File Type: ${fileType}
    - Company: ZEOLF Technology
    - Internal Document: ${isInternal ? 'Yes' : 'No'}
    `;

    if (recipientInfo) {
      prompt += `
    - Recipient Name: ${recipientInfo.name || 'Not specified'}
    - Recipient Address: ${recipientInfo.address || 'Not specified'}
    - Recipient Title: ${recipientInfo.title || 'Not specified'}
      `;
    }

    prompt += `
    
    Please include:
    1. Proper company header with ZEOLF Technology branding
    2. Appropriate document structure for ${documentType}
    3. Professional formatting suitable for ${fileType}
    4. Placeholder content that can be easily customized
    5. Standard business letter elements if applicable
    
    Format the response as clean, professional content that can be directly used in the document.`;

    return prompt;
  }

  private getPlaceholderTemplate(request: TemplateRequest): string {
    const { documentType, title, recipientInfo } = request;
    
    return `ZEOLF TECHNOLOGY
[Company Address]
[City, State ZIP Code]
[Phone Number] | [Email]

${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

${recipientInfo?.name ? `${recipientInfo.name}\n${recipientInfo.title || ''}\n${recipientInfo.address || ''}\n` : ''}

Subject: ${title}

Dear ${recipientInfo?.name || '[Recipient Name]'},

[This is a placeholder template for a ${documentType}. AI integration is not available in development mode.]

[Document content will be generated here when AI service is properly configured.]

Best regards,

[Your Name]
[Your Title]
ZEOLF Technology

---
Document Type: ${documentType}
Generated: ${new Date().toISOString()}
Status: Development Mode Template`;
  }

  // Alias methods for backward compatibility
  async generateTemplate(request: TemplateRequest): Promise<string> {
    return this.generateDocumentTemplate(request);
  }

  async improveContent(content: string, documentType: string = "document"): Promise<string> {
    return this.improveDocumentContent(content, documentType);
  }
}

export const grokService = new GrokService();