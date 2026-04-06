SET @schema_name = DATABASE();

SET @asset_visibility_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'asset_library'
    AND COLUMN_NAME = 'visibility'
);

SET @add_asset_visibility_sql = IF(
  @asset_visibility_exists = 0,
  "ALTER TABLE asset_library ADD COLUMN visibility ENUM('private', 'public') NOT NULL DEFAULT 'private' AFTER course_id",
  "SELECT 'asset_library.visibility already exists'"
);
PREPARE add_asset_visibility_stmt FROM @add_asset_visibility_sql;
EXECUTE add_asset_visibility_stmt;
DEALLOCATE PREPARE add_asset_visibility_stmt;

ALTER TABLE asset_library
  MODIFY COLUMN course_id BIGINT NULL;

SET @asset_teacher_visibility_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'asset_library'
    AND INDEX_NAME = 'idx_asset_library_teacher_visibility'
);

SET @create_asset_teacher_visibility_index_sql = IF(
  @asset_teacher_visibility_index_exists = 0,
  "CREATE INDEX idx_asset_library_teacher_visibility ON asset_library (teacher_id, visibility, status)",
  "SELECT 'idx_asset_library_teacher_visibility already exists'"
);
PREPARE create_asset_teacher_visibility_index_stmt FROM @create_asset_teacher_visibility_index_sql;
EXECUTE create_asset_teacher_visibility_index_stmt;
DEALLOCATE PREPARE create_asset_teacher_visibility_index_stmt;

SET @asset_visibility_status_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'asset_library'
    AND INDEX_NAME = 'idx_asset_library_visibility_status'
);

SET @create_asset_visibility_status_index_sql = IF(
  @asset_visibility_status_index_exists = 0,
  "CREATE INDEX idx_asset_library_visibility_status ON asset_library (visibility, status)",
  "SELECT 'idx_asset_library_visibility_status already exists'"
);
PREPARE create_asset_visibility_status_index_stmt FROM @create_asset_visibility_status_index_sql;
EXECUTE create_asset_visibility_status_index_stmt;
DEALLOCATE PREPARE create_asset_visibility_status_index_stmt;

CREATE TABLE IF NOT EXISTS teaching_prep_attachment (
  attachment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  prep_id BIGINT NOT NULL,
  source_type ENUM('upload', 'asset') NOT NULL,
  asset_id BIGINT NULL,
  file_path VARCHAR(500) NULL,
  file_name VARCHAR(255) NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type VARCHAR(120) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teaching_prep_attachment_prep FOREIGN KEY (prep_id) REFERENCES teaching_prep(prep_id) ON DELETE CASCADE,
  CONSTRAINT fk_teaching_prep_attachment_asset FOREIGN KEY (asset_id) REFERENCES asset_library(asset_id) ON DELETE SET NULL,
  INDEX idx_teaching_prep_attachment_prep_status (prep_id, status),
  INDEX idx_teaching_prep_attachment_asset_status (asset_id, status),
  INDEX idx_teaching_prep_attachment_sort (prep_id, sort_order, attachment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
