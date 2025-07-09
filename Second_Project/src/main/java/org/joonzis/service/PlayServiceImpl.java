package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.mapper.PlayMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlayServiceImpl implements PlayService {
	
	@Autowired
	PlayMapper playMapper;
	
	// 카테고리 별 문제 가져오기
	private static final List<String> ALLOWED_TABLES = List.of(
			"CPE_Q", "CPEI_Q", "CPET_Q", "ICT_Q", "ICTI_Q", "LM1_Q",
			"LM2_Q", "NET1_Q", "NET2_Q", "SEC_Q"
		);

		@Override
		public List<QuestionDTO> getQuestionsByCategory(String category) {
		    if ("random".equalsIgnoreCase(category)) {
		        return playMapper.getRandomQuestions();  // 10개 테이블 통합 랜덤
		    }

		    // ✅ 안전한 테이블명만 허용
		    if (!ALLOWED_TABLES.contains(category)) {
		        throw new IllegalArgumentException("허용되지 않은 테이블 이름입니다: " + category);
		    }

		    return playMapper.getQuestionsByCategory(category);
		}

}
