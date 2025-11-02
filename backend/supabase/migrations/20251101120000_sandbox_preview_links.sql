BEGIN;

CREATE TABLE IF NOT EXISTS sandbox_preview_links (
    slug TEXT PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    port INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_preview_links_project_port
    ON sandbox_preview_links(project_id, port);

ALTER TABLE sandbox_preview_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sandbox preview links are publicly readable" ON sandbox_preview_links
    FOR SELECT
    USING (true);

COMMIT;

