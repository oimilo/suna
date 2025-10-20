import { backendApi } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export {
  fetchSandboxJsonWithWarningBypass,
  type DaytonaBypassOptions,
} from './sandbox-fetch';

export enum DownloadFormat {
  PDF = 'pdf',
  PPTX = 'pptx',
  GOOGLE_SLIDES = 'google-slides',
}

export function parsePresentationSlidePath(filePath: string | null): {
  isValid: boolean;
  presentationName: string | null;
  slideNumber: number | null;
} {
  if (!filePath) {
    return { isValid: false, presentationName: null, slideNumber: null };
  }

  const match = filePath.match(/^presentations\/([^\/]+)\/slide_(\d+)\.html$/i);
  if (match) {
    return {
      isValid: true,
      presentationName: match[1],
      slideNumber: parseInt(match[2], 10),
    };
  }

  return { isValid: false, presentationName: null, slideNumber: null };
}

export function createPresentationViewerToolContent(
  presentationName: string,
  filePath: string,
  slideNumber: number,
): string {
  const mockToolOutput = {
    presentation_name: presentationName,
    presentation_path: filePath,
    slide_number: slideNumber,
    presentation_title: `Slide ${slideNumber}`,
  };

  return JSON.stringify({
    result: {
      output: JSON.stringify(mockToolOutput),
      success: true,
    },
    tool_name: 'presentation-viewer',
  });
}

export async function downloadPresentation(
  format: DownloadFormat,
  sandboxUrl: string,
  presentationPath: string,
  presentationName: string,
): Promise<void> {
  try {
    const response = await fetch(
      `${sandboxUrl}/presentation/convert-to-${format}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation_path: presentationPath,
          download: true,
        }),
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to download ${format}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presentationName}.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Downloaded ${presentationName} as ${format.toUpperCase()}`, {
      duration: 8000,
    });
  } catch (error) {
    console.error(`Error downloading ${format}:`, error);
    throw error;
  }
}

export const handleGoogleAuth = async (
  presentationPath: string,
  sandboxUrl: string,
) => {
  try {
    sessionStorage.setItem(
      'google_slides_upload_intent',
      JSON.stringify({
        presentation_path: presentationPath,
        sandbox_url: sandboxUrl,
      }),
    );

    const currentUrl = encodeURIComponent(window.location.href);
    const response = await backendApi.get(
      `/google/auth-url?return_url=${currentUrl}`,
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get auth URL');
    }

    const { auth_url } = response.data;

    if (auth_url) {
      window.location.href = auth_url;
      return;
    }
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    toast.error('Failed to initiate Google authentication');
  }
};

export const handleGoogleSlidesUpload = async (
  sandboxUrl: string,
  presentationPath: string,
) => {
  if (!sandboxUrl || !presentationPath) {
    throw new Error('Missing required parameters');
  }

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await backendApi.post(
      '/presentation-tools/convert-and-upload-to-slides',
      {
        presentation_path: presentationPath,
        sandbox_url: sandboxUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        timeout: 180000,
      },
    );

    if (!response.success) {
      throw new Error('Failed to upload to Google Slides');
    }

    const result = response.data;

    if (!result.success && !result.is_api_enabled) {
      toast.info('Redirecting to Google authentication...', {
        duration: 3000,
      });
      handleGoogleAuth(presentationPath, sandboxUrl);
      return {
        success: false,
        redirected_to_auth: true,
        message: 'Redirecting to Google authentication',
      };
    }

    if (result.google_slides_url) {
      toast.success('🎉 Presentation uploaded successfully!', {
        action: {
          label: 'Open in Google Slides',
          onClick: () => window.open(result.google_slides_url, '_blank'),
        },
        duration: 20000,
      });

      const presentationName =
        presentationPath.split('/').pop() || 'presentation';

      return {
        success: true,
        google_slides_url: result.google_slides_url,
        message: `"${presentationName}" uploaded successfully`,
      };
    }

    toast.success('Presentation uploaded successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error uploading to Google Slides:', error);
    toast.error('Failed to upload to Google Slides');
    throw error;
  }
};
