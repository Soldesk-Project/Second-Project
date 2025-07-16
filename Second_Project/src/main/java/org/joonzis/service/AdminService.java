package org.joonzis.service;

import org.joonzis.domain.QuestionDTO;
import java.util.List;
import java.util.Map;

public interface AdminService {
    void registerQuestion(QuestionDTO questionDTO, String category);
    
    Map<String, Object> searchQuestions(String category, String query, int page, int limit);
    
    void updateQuestion(QuestionDTO questionDTO, String category);
}