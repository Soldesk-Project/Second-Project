package org.joonzis.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.ProblemVO;

public interface ProblemMapper {
    List<ProblemVO> selectProblems(@Param("offset") int offset, @Param("limit") int limit);
    int countProblems();
    int insertProblem(ProblemVO problem);
    ProblemVO selectById(@Param("id") Long id);
}
