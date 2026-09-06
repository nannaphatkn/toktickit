-- Store the requester's reason when an attachment is soft-removed.
ALTER TABLE "Attachment" ADD COLUMN "removalReason" TEXT;
