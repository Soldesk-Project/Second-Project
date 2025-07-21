package org.joonzis.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.FaqVO;

public interface FaqMapper {
    List<FaqVO> selectFaqs(@Param("offset") int offset, @Param("limit") int limit);
    int countFaqs();
    int insertFaq(FaqVO faq);
    FaqVO selectById(@Param("id") Long id);
}
