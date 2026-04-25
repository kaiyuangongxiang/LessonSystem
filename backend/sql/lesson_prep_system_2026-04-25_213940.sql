-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: lesson_prep_system
-- ------------------------------------------------------
-- Server version	8.0.34

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `admin_id` bigint NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `admin_name` varchar(50) NOT NULL COMMENT '管理员账号',
  `admin_password` varchar(255) NOT NULL COMMENT '管理员密码',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `admin_name` (`admin_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asset_library`
--

DROP TABLE IF EXISTS `asset_library`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_library` (
  `asset_id` bigint NOT NULL AUTO_INCREMENT COMMENT '素材ID',
  `asset_type` varchar(20) NOT NULL COMMENT '素材类型:image/audio/text/question/template',
  `teacher_id` bigint NOT NULL COMMENT '上传教师ID',
  `course_id` bigint DEFAULT NULL,
  `visibility` enum('private','public') NOT NULL DEFAULT 'private',
  `asset_title` varchar(200) NOT NULL COMMENT '素材标题',
  `asset_description` text COMMENT '素材说明',
  `asset_content` text COMMENT '文本类素材内容',
  `file_path` varchar(500) DEFAULT NULL COMMENT '文件存储路径',
  `file_name` varchar(255) DEFAULT NULL COMMENT '原始文件名',
  `file_size` bigint NOT NULL DEFAULT '0' COMMENT '文件大小',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态:1正常 0删除',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`asset_id`),
  KEY `idx_asset_library_teacher_status` (`teacher_id`,`status`),
  KEY `idx_asset_library_course_status` (`course_id`,`status`),
  KEY `idx_asset_library_type_status` (`asset_type`,`status`),
  KEY `idx_asset_library_teacher_visibility` (`teacher_id`,`visibility`,`status`),
  KEY `idx_asset_library_visibility_status` (`visibility`,`status`),
  CONSTRAINT `fk_asset_library_course` FOREIGN KEY (`course_id`) REFERENCES `course_intro` (`course_id`),
  CONSTRAINT `fk_asset_library_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_user` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='教学素材库';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `college`
--

DROP TABLE IF EXISTS `college`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `college` (
  `college_id` bigint NOT NULL AUTO_INCREMENT COMMENT '学院ID',
  `college_name` varchar(100) NOT NULL COMMENT '学院名称',
  `college_intro` text COMMENT '学院简介',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`college_id`),
  UNIQUE KEY `college_name` (`college_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学院表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_intro`
--

DROP TABLE IF EXISTS `course_intro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_intro` (
  `course_id` bigint NOT NULL AUTO_INCREMENT COMMENT '课程ID',
  `course_name` varchar(100) NOT NULL COMMENT '课程名称',
  `course_summary` text COMMENT '课程简介',
  `college_id` bigint DEFAULT NULL COMMENT '所属学院ID',
  `teacher_id` bigint DEFAULT NULL COMMENT '课程负责人教师ID',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1启用 0停用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`course_id`),
  KEY `idx_course_intro_college_id` (`college_id`),
  KEY `idx_course_intro_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_course_college` FOREIGN KEY (`college_id`) REFERENCES `college` (`college_id`),
  CONSTRAINT `fk_course_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_user` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='课程表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_video`
--

DROP TABLE IF EXISTS `course_video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_video` (
  `video_id` bigint NOT NULL AUTO_INCREMENT COMMENT '视频ID',
  `video_title` varchar(200) NOT NULL COMMENT '视频标题',
  `course_id` bigint NOT NULL COMMENT '所属课程ID',
  `teacher_id` bigint NOT NULL COMMENT '上传教师ID',
  `video_path` varchar(500) NOT NULL COMMENT '视频路径',
  `cover_path` varchar(500) DEFAULT NULL COMMENT '封面路径',
  `duration` int DEFAULT NULL COMMENT '视频时长(秒)',
  `file_size` bigint DEFAULT '0' COMMENT '文件大小(字节)',
  `description` text COMMENT '视频说明',
  `play_count` int NOT NULL DEFAULT '0' COMMENT '播放次数',
  `download_count` int NOT NULL DEFAULT '0' COMMENT '下载次数',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1正常 0删除/禁用',
  `upload_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`video_id`),
  KEY `idx_course_video_teacher_id` (`teacher_id`),
  KEY `idx_course_video_course_id` (`course_id`),
  CONSTRAINT `fk_video_course` FOREIGN KEY (`course_id`) REFERENCES `course_intro` (`course_id`),
  CONSTRAINT `fk_video_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_user` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='课程视频表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courseware`
--

DROP TABLE IF EXISTS `courseware`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courseware` (
  `courseware_id` bigint NOT NULL AUTO_INCREMENT,
  `teacher_id` bigint NOT NULL,
  `course_id` bigint NOT NULL,
  `prep_id` bigint NOT NULL,
  `courseware_title` varchar(200) NOT NULL,
  `courseware_summary` text,
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `content_json` longtext NOT NULL,
  `published_time` datetime DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`courseware_id`),
  KEY `idx_courseware_teacher_status` (`teacher_id`,`status`),
  KEY `idx_courseware_course_status` (`course_id`,`status`),
  KEY `idx_courseware_prep_status` (`prep_id`,`status`),
  KEY `idx_courseware_update_time` (`update_time`),
  CONSTRAINT `fk_courseware_course` FOREIGN KEY (`course_id`) REFERENCES `course_intro` (`course_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_courseware_prep` FOREIGN KEY (`prep_id`) REFERENCES `teaching_prep` (`prep_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_courseware_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_user` (`teacher_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `material`
--

DROP TABLE IF EXISTS `material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material` (
  `material_id` bigint NOT NULL AUTO_INCREMENT COMMENT '资料ID',
  `material_name` varchar(200) NOT NULL COMMENT '资料名称',
  `material_type` varchar(50) NOT NULL DEFAULT 'document' COMMENT '资源类型',
  `teacher_id` bigint NOT NULL COMMENT '上传教师ID',
  `course_id` bigint NOT NULL COMMENT '所属课程ID',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_name` varchar(255) DEFAULT NULL COMMENT '原始文件名',
  `file_size` bigint DEFAULT '0' COMMENT '文件大小(字节)',
  `description` text COMMENT '资料描述',
  `download_count` int NOT NULL DEFAULT '0' COMMENT '下载次数',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1正常 0删除/禁用',
  `upload_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`material_id`),
  KEY `idx_material_teacher_id` (`teacher_id`),
  KEY `idx_material_course_id` (`course_id`),
  CONSTRAINT `fk_material_course` FOREIGN KEY (`course_id`) REFERENCES `course_intro` (`course_id`),
  CONSTRAINT `fk_material_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_user` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='备课资料表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `message_id` bigint NOT NULL AUTO_INCREMENT COMMENT '留言ID',
  `teacher_id` bigint DEFAULT NULL COMMENT '留言教师ID',
  `user_name` varchar(50) DEFAULT NULL COMMENT '留言人名称',
  `content` text NOT NULL COMMENT '留言内容',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0未回复 1已回复',
  `message_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '留言时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`message_id`),
  KEY `idx_message_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_message_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_user` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='留言表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `message_reply`
--

DROP TABLE IF EXISTS `message_reply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_reply` (
  `reply_id` bigint NOT NULL AUTO_INCREMENT COMMENT '回复ID',
  `message_id` bigint NOT NULL COMMENT '留言ID',
  `admin_id` bigint NOT NULL COMMENT '回复管理员ID',
  `reply_content` text NOT NULL COMMENT '回复内容',
  `reply_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '回复时间',
  PRIMARY KEY (`reply_id`),
  KEY `fk_reply_message` (`message_id`),
  KEY `fk_reply_admin` (`admin_id`),
  CONSTRAINT `fk_reply_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`admin_id`),
  CONSTRAINT `fk_reply_message` FOREIGN KEY (`message_id`) REFERENCES `message` (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='留言回复表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `message_topic`
--

DROP TABLE IF EXISTS `message_topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_topic` (
  `topic_id` bigint NOT NULL AUTO_INCREMENT COMMENT '交流主题ID',
  `teacher_id` bigint DEFAULT NULL COMMENT '??????ID',
  `admin_id` bigint DEFAULT NULL COMMENT '????????D',
  `student_id` bigint DEFAULT NULL,
  `title` varchar(100) NOT NULL COMMENT '主题标题',
  `content` text NOT NULL COMMENT '主题内容',
  `status` enum('open','active','archived') NOT NULL DEFAULT 'open' COMMENT '状态：open讨论中 active持续交流 archived已整理',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`topic_id`),
  KEY `idx_message_topic_teacher_id` (`teacher_id`),
  KEY `idx_message_topic_update_time` (`update_time`),
  KEY `idx_message_topic_admin_id` (`admin_id`),
  KEY `idx_message_topic_student` (`student_id`),
  CONSTRAINT `fk_message_topic_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`admin_id`),
  CONSTRAINT `fk_message_topic_student` FOREIGN KEY (`student_id`) REFERENCES `student_user` (`student_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_message_topic_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_user` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='教学交流主题表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `message_topic_reply`
--

DROP TABLE IF EXISTS `message_topic_reply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_topic_reply` (
  `reply_id` bigint NOT NULL AUTO_INCREMENT COMMENT '回复ID',
  `topic_id` bigint NOT NULL COMMENT '交流主题ID',
  `parent_reply_id` bigint DEFAULT NULL COMMENT '??????ID',
  `teacher_id` bigint DEFAULT NULL COMMENT '??????ID',
  `admin_id` bigint DEFAULT NULL COMMENT '????????D',
  `student_id` bigint DEFAULT NULL,
  `content` text NOT NULL COMMENT '回复内容',
  `reply_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '回复时间',
  PRIMARY KEY (`reply_id`),
  KEY `fk_message_topic_reply_teacher` (`teacher_id`),
  KEY `idx_message_topic_reply_topic_id` (`topic_id`),
  KEY `idx_message_topic_reply_admin_id` (`admin_id`),
  KEY `idx_message_topic_reply_parent_id` (`parent_reply_id`),
  KEY `idx_message_topic_reply_student` (`student_id`),
  CONSTRAINT `fk_message_topic_reply_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`admin_id`),
  CONSTRAINT `fk_message_topic_reply_parent` FOREIGN KEY (`parent_reply_id`) REFERENCES `message_topic_reply` (`reply_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_message_topic_reply_student` FOREIGN KEY (`student_id`) REFERENCES `student_user` (`student_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_message_topic_reply_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_user` (`teacher_id`),
  CONSTRAINT `fk_message_topic_reply_topic` FOREIGN KEY (`topic_id`) REFERENCES `message_topic` (`topic_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='教学交流回复表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notice`
--

DROP TABLE IF EXISTS `notice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notice` (
  `notice_id` bigint NOT NULL AUTO_INCREMENT COMMENT '公告ID',
  `notice_title` varchar(200) NOT NULL COMMENT '公告标题',
  `notice_content` text NOT NULL COMMENT '公告内容',
  `publisher_admin_id` bigint DEFAULT NULL COMMENT '发布管理员ID',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1发布 0下线',
  `publish_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`notice_id`),
  KEY `fk_notice_admin` (`publisher_admin_id`),
  KEY `idx_notice_publish_time` (`publish_time`),
  CONSTRAINT `fk_notice_admin` FOREIGN KEY (`publisher_admin_id`) REFERENCES `admin` (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='公告表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_user`
--

DROP TABLE IF EXISTS `student_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_user` (
  `student_id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `student_name` varchar(50) DEFAULT NULL,
  `gender` enum('男','女','未知') DEFAULT '未知',
  `college_id` bigint DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `profile` text,
  `status` tinyint NOT NULL DEFAULT '1',
  `register_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_student_user_college_id` (`college_id`),
  CONSTRAINT `fk_student_college` FOREIGN KEY (`college_id`) REFERENCES `college` (`college_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学生表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_profile`
--

DROP TABLE IF EXISTS `system_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_profile` (
  `profile_id` bigint NOT NULL AUTO_INCREMENT COMMENT '系统介绍ID',
  `system_name` varchar(100) NOT NULL COMMENT '系统名称',
  `hero_title` varchar(120) DEFAULT NULL COMMENT '首页主标题',
  `system_intro` text COMMENT '系统介绍',
  `update_admin_id` bigint DEFAULT NULL COMMENT '更新管理员ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`profile_id`),
  KEY `fk_profile_admin` (`update_admin_id`),
  CONSTRAINT `fk_profile_admin` FOREIGN KEY (`update_admin_id`) REFERENCES `admin` (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统介绍表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teacher_user`
--

DROP TABLE IF EXISTS `teacher_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_user` (
  `teacher_id` bigint NOT NULL AUTO_INCREMENT COMMENT '教师ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '登录密码',
  `teacher_name` varchar(50) DEFAULT NULL COMMENT '教师姓名',
  `gender` enum('男','女','未知') DEFAULT '未知' COMMENT '性别',
  `college_id` bigint DEFAULT NULL COMMENT '所属学院ID',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `profile` text COMMENT '个人简介',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1正常 0禁用',
  `register_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`teacher_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_teacher_user_college_id` (`college_id`),
  CONSTRAINT `fk_teacher_college` FOREIGN KEY (`college_id`) REFERENCES `college` (`college_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='教师用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teaching_prep`
--

DROP TABLE IF EXISTS `teaching_prep`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teaching_prep` (
  `prep_id` bigint NOT NULL AUTO_INCREMENT,
  `teacher_id` bigint NOT NULL,
  `course_id` bigint NOT NULL,
  `prep_title` varchar(200) NOT NULL,
  `teaching_objective` text,
  `key_points` text,
  `difficulty_points` text,
  `student_analysis` text,
  `teaching_content` text,
  `teaching_process` text,
  `reflection_notes` text,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`prep_id`),
  KEY `idx_teaching_prep_teacher_status` (`teacher_id`,`status`),
  KEY `idx_teaching_prep_course_status` (`course_id`,`status`),
  KEY `idx_teaching_prep_update_time` (`update_time`),
  CONSTRAINT `fk_teaching_prep_course` FOREIGN KEY (`course_id`) REFERENCES `course_intro` (`course_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teaching_prep_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_user` (`teacher_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='教师备课表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teaching_prep_attachment`
--

DROP TABLE IF EXISTS `teaching_prep_attachment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teaching_prep_attachment` (
  `attachment_id` bigint NOT NULL AUTO_INCREMENT,
  `prep_id` bigint NOT NULL,
  `source_type` enum('upload','asset') NOT NULL,
  `asset_id` bigint DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` bigint NOT NULL DEFAULT '0',
  `mime_type` varchar(120) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '1',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`attachment_id`),
  KEY `idx_teaching_prep_attachment_prep_status` (`prep_id`,`status`),
  KEY `idx_teaching_prep_attachment_asset_status` (`asset_id`,`status`),
  KEY `idx_teaching_prep_attachment_sort` (`prep_id`,`sort_order`,`attachment_id`),
  CONSTRAINT `fk_teaching_prep_attachment_asset` FOREIGN KEY (`asset_id`) REFERENCES `asset_library` (`asset_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_teaching_prep_attachment_prep` FOREIGN KEY (`prep_id`) REFERENCES `teaching_prep` (`prep_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'lesson_prep_system'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-25 21:39:53
