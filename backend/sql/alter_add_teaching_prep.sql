CREATE TABLE IF NOT EXISTS teaching_prep (
  prep_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  teacher_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  prep_title VARCHAR(200) NOT NULL,
  teaching_content TEXT NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teaching_prep_teacher FOREIGN KEY (teacher_id) REFERENCES teacher_user(teacher_id) ON DELETE CASCADE,
  CONSTRAINT fk_teaching_prep_course FOREIGN KEY (course_id) REFERENCES course_intro(course_id) ON DELETE CASCADE,
  INDEX idx_teaching_prep_teacher_status (teacher_id, status),
  INDEX idx_teaching_prep_course_status (course_id, status),
  INDEX idx_teaching_prep_update_time (update_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
