package org.joonzis.service;

import java.util.Map;
import org.joonzis.domain.ProblemVO;

public interface ProblemService {
    Map<String,Object> getProblems(int page, int size);
    ProblemVO findById(Long id);
    void createProblem(ProblemVO problem);
}