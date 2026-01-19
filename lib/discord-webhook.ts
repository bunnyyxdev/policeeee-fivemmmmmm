import axios from 'axios';

export type WebhookType = 'general' | 'notifications' | 'withdrawals' | 'admin' | 'activities' | 'feedback' | 'blacklist' | 'error';

// Get webhook URLs for a specific type
function getWebhookUrls(type: WebhookType): string[] {
  // Special handling for feedback webhook
  if (type === 'feedback') {
    const feedbackUrl = process.env.DISCORD_FEEDBACK_URL;
    if (feedbackUrl) {
      return feedbackUrl.split(',').map(url => url.trim()).filter(Boolean);
    }
    // Fallback to general webhook if DISCORD_FEEDBACK_URL is not set
    const generalUrl = process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_GENERAL;
    return generalUrl ? generalUrl.split(',').map(url => url.trim()).filter(Boolean) : [];
  }

  // First, check for type-specific webhook (e.g., DISCORD_WEBHOOK_NOTIFICATIONS)
  const typeSpecificKey = `DISCORD_WEBHOOK_${type.toUpperCase()}`;
  const typeSpecificUrl = process.env[typeSpecificKey];

  // Then, check for fallback general webhook
  const generalUrl = process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_GENERAL;

  // Support multiple webhooks per type (comma-separated)
  const urls: string[] = [];
  
  if (typeSpecificUrl) {
    // Split by comma to support multiple webhooks
    urls.push(...typeSpecificUrl.split(',').map(url => url.trim()).filter(Boolean));
  }
  
  // Only add general webhook if no type-specific webhook is configured
  // or if it's different from what we already have
  if (generalUrl && (!typeSpecificUrl || generalUrl !== typeSpecificUrl)) {
    urls.push(...generalUrl.split(',').map(url => url.trim()).filter(Boolean));
  }

  return Array.from(new Set(urls)); // Remove duplicates
}

async function sendToWebhook(
  url: string,
  title: string,
  message: string,
  color: number,
  imageUrl?: string,
  messageId?: string | null,
  footer?: string
) {
  try {
    const embed: any = {
      title,
      description: message,
      color,
      timestamp: new Date().toISOString(),
    };

    // Add footer if provided
    if (footer) {
      embed.footer = {
        text: footer,
      };
    }

    let imageBuffer: Buffer | null = null;
    let imageFilename: string | null = null;
    let imageMimeType: string = 'image/png';

    // Handle image URL
    if (imageUrl) {
      if (imageUrl.startsWith('data:')) {
        // Extract base64 data and mime type from data URL
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const [, mimeType, base64Data] = matches;
          imageBuffer = Buffer.from(base64Data, 'base64');
          imageMimeType = mimeType || 'image/png';
          
          // Determine file extension from mime type
          const extMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
          };
          const ext = extMap[mimeType] || 'png';
          imageFilename = `error-report.${ext}`;
        }
      } else {
        // Get full URL if it's a relative path
        // Priority: NEXT_PUBLIC_BASE_URL > VERCEL_URL > provided Vercel URL > default Vercel URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
          || 'https://police-fivem-preview.vercel.app';
        
        const fullImageUrl = imageUrl.startsWith('http')
          ? imageUrl
          : `${baseUrl}${imageUrl}`;
        embed.image = { url: fullImageUrl };
      }
    }

    // If messageId is provided, try to edit the message (PATCH)
    // Format: PATCH /webhooks/{webhook_id}/{webhook_token}/messages/{message_id}
    if (messageId && !imageBuffer) {
      // Can only edit if no file attachment
      try {
        // Extract webhook ID and token from URL
        const urlMatch = url.match(/webhooks\/(\d+)\/([^\/]+)/);
        if (urlMatch) {
          const [, webhookId, webhookToken] = urlMatch;
          const editUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`;
          await axios.patch(editUrl, {
            embeds: [embed],
          });
          return { messageId };
        }
      } catch (editError) {
        console.warn('Failed to edit webhook message, sending new message instead:', editError);
        // Fall through to POST new message
      }
    }

    // Send new message (POST) or fallback if edit failed
    if (imageBuffer && imageFilename) {
      // Send with file attachment using FormData
      // Use dynamic import for form-data to avoid issues
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('payload_json', JSON.stringify({ embeds: [embed] }));
      formData.append('files[0]', imageBuffer, {
        filename: imageFilename,
        contentType: imageMimeType,
      });

      const response = await axios.post(url, formData, {
        headers: formData.getHeaders(),
      });
      
      const returnedMessageId = response.data?.id || null;
      return { messageId: returnedMessageId };
    } else {
      // Send without file attachment
      const response = await axios.post(url, {
        embeds: [embed],
      });
      
      const returnedMessageId = response.data?.id || null;
      return { messageId: returnedMessageId };
    }
  } catch (error) {
    console.error(`Failed to send Discord notification to webhook:`, error);
    return { messageId: null };
  }
}

export async function sendDiscordNotification(
  title: string,
  message: string,
  color: number = 0x3498db, // Default blue color
  webhookType: WebhookType = 'general',
  imageUrl?: string,
  messageId?: string | null,
  footer?: string
) {
  const webhookUrls = getWebhookUrls(webhookType);

  if (webhookUrls.length === 0) {
    console.warn(`Discord webhook URL not configured for type: ${webhookType}`);
    return { messageId: null };
  }

  // For other types, can send to all webhooks
  const urlsToUse = webhookUrls;

  // Send to selected webhooks
  const results = await Promise.all(
    urlsToUse.map(url => sendToWebhook(url, title, message, color, imageUrl, messageId, footer))
  );
  
  return results[0] || { messageId: null };
}

// Convenience functions with webhook type support
export async function sendSuccessNotification(
  title: string,
  message: string,
  webhookType: WebhookType = 'general'
) {
  await sendDiscordNotification(title, message, 0x2ecc71, webhookType); // Green
}

export async function sendWarningNotification(
  title: string,
  message: string,
  webhookType: WebhookType = 'general'
) {
  await sendDiscordNotification(title, message, 0xf39c12, webhookType); // Orange
}

export async function sendErrorNotification(
  title: string,
  message: string,
  webhookType: WebhookType = 'general'
) {
  await sendDiscordNotification(title, message, 0xe74c3c, webhookType); // Red
}
