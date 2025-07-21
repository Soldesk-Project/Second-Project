package org.joonzis.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.joonzis.domain.ProblemVO;
import org.joonzis.mapper.ProblemMapper;
import org.joonzis.service.ProblemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProblemServiceImpl implements ProblemService {

    @Autowired private ProblemMapper mapper;

    @Override
    public Map<String,Object> getProblems(int page, int size) {
        int offset = (page - 1) * size;
        List<ProblemVO> items = mapper.selectProblems(offset, size);
        int totalCount = mapper.countProblems();
        Map<String,Object> result = new HashMap<>();
        result.put("items", items);
        result.put("totalCount", totalCount);
        return result;
    }

    @Override
    public ProblemVO findById(Long id) {
        return mapper.selectById(id);
    }

    @Transactional
    @Override
    public void createProblem(ProblemVO problem) {
        mapper.insertProblem(problem);
    }
}