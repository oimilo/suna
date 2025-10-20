'use client';

import React from 'react';
import { ThreadComponent } from '@/components/thread/ThreadComponent';

export default function ThreadPage({
  params,
}: {
  params: Promise<{ projectId: string; threadId: string }>;
}) {
  const { projectId, threadId } = React.use(params);
  return <ThreadComponent projectId={projectId} threadId={threadId} />;
}
