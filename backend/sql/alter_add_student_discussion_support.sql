ALTER TABLE message_topic
  ADD COLUMN IF NOT EXISTS student_id BIGINT NULL AFTER admin_id,
  ADD INDEX idx_message_topic_student (student_id),
  ADD CONSTRAINT fk_message_topic_student
    FOREIGN KEY (student_id) REFERENCES student_user(student_id) ON DELETE SET NULL;

ALTER TABLE message_topic_reply
  ADD COLUMN IF NOT EXISTS student_id BIGINT NULL AFTER admin_id,
  ADD INDEX idx_message_topic_reply_student (student_id),
  ADD CONSTRAINT fk_message_topic_reply_student
    FOREIGN KEY (student_id) REFERENCES student_user(student_id) ON DELETE SET NULL;
