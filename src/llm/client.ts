import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto-js';

export interface LLMMetrics {
  ttft?: number;
  totalLatency: number;
  outputTokens: number;
  tokensPerSec: number;
  finishReason?: string;
  requestId: string;
}

export interface LLMResponse {
  output: string;
  metrics: LLMMetrics;
  outputHash: string;
  error?: string;
}

export class LLMClient {
  private client: Anthropic;
  private model: string;
  private temperature: number;
  private topP: number;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    this.temperature = parseFloat(process.env.TEMPERATURE || '0.1');
    this.topP = parseFloat(process.env.TOP_P || '0.3');
  }

  async executePrompt(
    prompt: string,
    maxTokens: number = 1000,
    cacheBusting: boolean = false
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    let ttft: number | undefined;
    let firstTokenReceived = false;

    try {
      const finalPrompt = cacheBusting 
        ? `${prompt}\n\n[nonce: ${Date.now()}_${Math.random()}]`
        : prompt;

      const messageParams: any = {
        model: this.model,
        max_tokens: maxTokens,
        temperature: this.temperature,
        messages: [{ role: 'user', content: finalPrompt }],
        stream: true,
      };
      
      // Only add top_p if model is not opus
      if (!this.model.includes('opus')) {
        messageParams.top_p = this.topP;
      }
      
      const stream = await this.client.messages.create(messageParams);

      let output = '';
      let outputTokens = 0;
      let finishReason: string | undefined;
      let requestId = '';

      for await (const chunk of stream) {
        if (!firstTokenReceived && chunk.type === 'content_block_delta') {
          ttft = (Date.now() - startTime) / 1000;
          firstTokenReceived = true;
        }

        if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
          output += chunk.delta.text;
          outputTokens++;
        }

        if (chunk.type === 'message_stop') {
          finishReason = 'stop';
        }

        if (chunk.type === 'message_start' && chunk.message.id) {
          requestId = chunk.message.id;
        }
      }

      const totalLatency = (Date.now() - startTime) / 1000;
      const tokensPerSec = outputTokens / totalLatency;
      const outputHash = crypto.SHA256(output).toString();

      return {
        output,
        metrics: {
          ttft,
          totalLatency,
          outputTokens,
          tokensPerSec,
          finishReason,
          requestId: requestId || `req_${Date.now()}`,
        },
        outputHash,
      };
    } catch (error) {
      const totalLatency = (Date.now() - startTime) / 1000;
      return {
        output: '',
        metrics: {
          totalLatency,
          outputTokens: 0,
          tokensPerSec: 0,
          requestId: `error_${Date.now()}`,
        },
        outputHash: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async executeWithRetry(
    prompt: string,
    maxTokens: number = 1000,
    cacheBusting: boolean = false,
    maxRetries: number = 0
  ): Promise<LLMResponse> {
    let lastError: Error | undefined;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const response = await this.executePrompt(prompt, maxTokens, cacheBusting);
        if (!response.error) {
          return response;
        }
        lastError = new Error(response.error);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }

    throw lastError || new Error('All retries failed');
  }
}