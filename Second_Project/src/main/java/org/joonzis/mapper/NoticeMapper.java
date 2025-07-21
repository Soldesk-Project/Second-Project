package org.joonzis.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.NoticeVO;

public interface NoticeMapper {
    List<NoticeVO> selectNotices(@Param("offset") int offset, @Param("limit") int limit);
    int countNotices();
    int insertNotice(NoticeVO notice);
    NoticeVO selectById(@Param("id") Long id);
}
