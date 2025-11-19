-- Migration: Create feedback table for storing user feedback
-- This table stores ratings and feedback messages. Can be associated with messages/threads or standalone.

BEGIN;

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES threads(thread_id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(message_id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0 AND rating % 0.5 = 0),
    feedback_text TEXT,
    help_improve BOOLEAN DEFAULT TRUE,
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_unique
    ON feedback(thread_id, message_id, account_id)
    WHERE thread_id IS NOT NULL AND message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_thread_id ON feedback(thread_id);
CREATE INDEX IF NOT EXISTS idx_feedback_message_id ON feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_account_id ON feedback(account_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
    ON feedback
    FOR SELECT
    USING (auth.uid() = account_id);

CREATE POLICY "Users can insert their own feedback"
    ON feedback
    FOR INSERT
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update their own feedback"
    ON feedback
    FOR UPDATE
    USING (auth.uid() = account_id)
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can delete their own feedback"
    ON feedback
    FOR DELETE
    USING (auth.uid() = account_id);

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

COMMENT ON TABLE feedback IS 'Stores user feedback (ratings and comments). Can be associated with messages/threads or standalone.';
COMMENT ON COLUMN feedback.rating IS 'Rating from 0.5 to 5.0 in 0.5 increments (half stars)';
COMMENT ON COLUMN feedback.feedback_text IS 'Optional text feedback from the user';
COMMENT ON COLUMN feedback.help_improve IS 'Whether the user wants to help improve the service';
COMMENT ON COLUMN feedback.context IS 'Additional context/metadata as JSONB';
COMMENT ON COLUMN feedback.thread_id IS 'Optional thread ID if feedback is associated with a thread';
COMMENT ON COLUMN feedback.message_id IS 'Optional message ID if feedback is associated with a message';

COMMIT;

