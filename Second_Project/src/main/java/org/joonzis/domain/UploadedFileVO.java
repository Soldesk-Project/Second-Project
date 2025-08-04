package org.joonzis.domain;

import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@ToString
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UploadedFileVO {
    private int file_no;                 // PK
    private String original_name;        // 원본 파일명
    private String stored_name;          // 저장된 파일명
    private String stored_path;          // 저장된 전체 경로
    private Timestamp upload_time;       // 업로드 시간
}
