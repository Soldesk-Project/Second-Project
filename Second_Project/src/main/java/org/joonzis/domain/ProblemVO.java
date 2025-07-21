package org.joonzis.domain;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

@Data 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class ProblemVO {
    private Long id;
    private String subject;
    private String message;
    private String userNick;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime createdAt;
}