-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('TEACHER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('CURRICULUM_DESIGN', 'TEACHERS_GUIDE', 'LEARNERS_BOOK', 'ASSESSMENT_RUBRIC');

-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."TemplateType" AS ENUM ('SCHEME_OF_WORK', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "public"."LibraryFileStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "public"."LibraryFileType" AS ENUM ('PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'UPLOAD_FILE', 'APPROVE_FILE', 'DECLINE_FILE', 'DELETE_FILE', 'CREATE_SECTION', 'CREATE_SUBFOLDER');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'TEACHER',
    "school" TEXT,
    "county" TEXT,
    "subjects" TEXT,
    "password" TEXT NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "documentType" "public"."DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "extractedContent" TEXT,
    "processingStatus" "public"."ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schemes_of_work" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "strand" TEXT NOT NULL,
    "subStrand" TEXT,
    "duration" TEXT NOT NULL,
    "weeks" INTEGER NOT NULL,
    "generalObjectives" TEXT NOT NULL,
    "weeklyPlans" TEXT NOT NULL,
    "resources" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schemes_of_work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheme_of_work_files" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "strand" TEXT,
    "subStrand" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheme_of_work_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheme_templates" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "extractedText" TEXT,
    "subject" TEXT,
    "grade" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheme_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."TemplateType" NOT NULL,
    "subject" TEXT,
    "grade" TEXT,
    "content" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lesson_plans" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "folderId" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."library_sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."library_subfolders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "metadata" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_subfolders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."library_files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" "public"."LibraryFileType" NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "public"."LibraryFileStatus" NOT NULL DEFAULT 'PENDING',
    "sectionId" TEXT NOT NULL,
    "subfolderId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "metadata" TEXT,
    "description" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheme_of_work_versions" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "editedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheme_of_work_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lesson_plan_versions" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "editedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "library_sections_name_key" ON "public"."library_sections"("name");

-- CreateIndex
CREATE UNIQUE INDEX "library_subfolders_sectionId_name_key" ON "public"."library_subfolders"("sectionId", "name");

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_chunks" ADD CONSTRAINT "document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schemes_of_work" ADD CONSTRAINT "schemes_of_work_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheme_of_work_files" ADD CONSTRAINT "scheme_of_work_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheme_templates" ADD CONSTRAINT "scheme_templates_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_plans" ADD CONSTRAINT "lesson_plans_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_plans" ADD CONSTRAINT "lesson_plans_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."folders" ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "public"."lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_subfolders" ADD CONSTRAINT "library_subfolders_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."library_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_files" ADD CONSTRAINT "library_files_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."library_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_files" ADD CONSTRAINT "library_files_subfolderId_fkey" FOREIGN KEY ("subfolderId") REFERENCES "public"."library_subfolders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_files" ADD CONSTRAINT "library_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheme_of_work_versions" ADD CONSTRAINT "scheme_of_work_versions_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "public"."schemes_of_work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheme_of_work_versions" ADD CONSTRAINT "scheme_of_work_versions_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_plan_versions" ADD CONSTRAINT "lesson_plan_versions_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "public"."lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_plan_versions" ADD CONSTRAINT "lesson_plan_versions_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
