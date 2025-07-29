package org.joonzis.domain;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

@Data 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class FaqVO {
    private Long id;
    private String question;
    private String answer;
    private String category;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime createdAt;
}