SET @schema_name = DATABASE();

SET @course_teaching_goal_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'course_intro'
    AND COLUMN_NAME = 'teaching_goal'
);

SET @drop_course_teaching_goal_sql = IF(
  @course_teaching_goal_exists > 0,
  "ALTER TABLE course_intro DROP COLUMN teaching_goal",
  "SELECT 'course_intro.teaching_goal already removed'"
);
PREPARE drop_course_teaching_goal_stmt FROM @drop_course_teaching_goal_sql;
EXECUTE drop_course_teaching_goal_stmt;
DEALLOCATE PREPARE drop_course_teaching_goal_stmt;

SET @course_teaching_content_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'course_intro'
    AND COLUMN_NAME = 'teaching_content'
);

SET @drop_course_teaching_content_sql = IF(
  @course_teaching_content_exists > 0,
  "ALTER TABLE course_intro DROP COLUMN teaching_content",
  "SELECT 'course_intro.teaching_content already removed'"
);
PREPARE drop_course_teaching_content_stmt FROM @drop_course_teaching_content_sql;
EXECUTE drop_course_teaching_content_stmt;
DEALLOCATE PREPARE drop_course_teaching_content_stmt;

SET @course_teaching_idea_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'course_intro'
    AND COLUMN_NAME = 'teaching_idea'
);

SET @drop_course_teaching_idea_sql = IF(
  @course_teaching_idea_exists > 0,
  "ALTER TABLE course_intro DROP COLUMN teaching_idea",
  "SELECT 'course_intro.teaching_idea already removed'"
);
PREPARE drop_course_teaching_idea_stmt FROM @drop_course_teaching_idea_sql;
EXECUTE drop_course_teaching_idea_stmt;
DEALLOCATE PREPARE drop_course_teaching_idea_stmt;
