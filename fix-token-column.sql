-- Fix refresh_tokens token column to support longer JWT tokens
ALTER TABLE refresh_tokens ALTER COLUMN token TYPE text;
