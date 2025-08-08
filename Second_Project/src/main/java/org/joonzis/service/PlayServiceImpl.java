package org.joonzis.service;

import java.util.Base64;
import java.util.List;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UserQuestionHistoryDTO;
import org.joonzis.mapper.PlayMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlayServiceImpl implements PlayService {
	
	@Autowired
	PlayMapper playMapper;
	
	// 카테고리 별 문제 가져오기
	private static final List<String> ALLOWED_TABLES = List.of(
		"cpe", "cpei", "cpet", "ict", "icti", "lm1",
		"lm2", "net1", "net2", "sec"
	);

	@Override
	public List<QuestionDTO> getQuestionsByCategory(String category) {
	    if ("random".equalsIgnoreCase(category)) {
	        return playMapper.getRandomQuestions();  // 10개 테이블 통합 랜덤
	    }

	    // ✅ 안전한 카테고리명만 허용
	    if (!ALLOWED_TABLES.contains(category)) {
	        throw new IllegalArgumentException("허용되지 않은 카테고리 이름입니다: " + category);
	    }

	    return playMapper.getQuestionsByCategory(category);
	}
		
	@Override
	public void increaseRewardPoints(int point, int rank_point, String user_nick) {
		try {
			System.out.println("increaseRewardPoints 실행됨");
			playMapper.increaseRewardPoints(point, rank_point, user_nick);
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void saveUserHistory(List<UserQuestionHistoryDTO> historyList) {
	    for (UserQuestionHistoryDTO dto : historyList) {
	    	playMapper.insertHistory(dto);
	    }
	}
	
	@Override
	public void countFirst(String user_nick) {
		playMapper.countFirst(user_nick);
	}
	
	@Override
	public void leavePanalty(String user_nick) {
		playMapper.leavePanalty(user_nick);
	}

	@Override
	public List<UserQuestionHistoryDTO> getQuestionReviewList(String user_nick) {
		System.out.println("getQuestionReviewList : " +user_nick);
		System.out.println("getQuestionReviewList : " +playMapper.getQuestionReviewList(user_nick).size());
		return playMapper.getQuestionReviewList(user_nick);
	}
	
	@Override
	public List<UserQuestionHistoryDTO> getUserQuestionHistory(String submittedAt) {
		return playMapper.getUserQuestionHistory(submittedAt);
	}
	
	// 문제 오류 저장
	@Override
    public void saveReport(UserQuestionHistoryDTO report) {
        // 이미지 Base64 → byte[] 변환 처리
        if (report.getImage_data_base64() != null && !report.getImage_data_base64().isEmpty()) {
            String base64 = report.getImage_data_base64();
            if (base64.startsWith("data:")) {
                base64 = base64.substring(base64.indexOf(",") + 1);
            }
            report.setImage_data(Base64.getDecoder().decode(base64));
        }
        playMapper.saveReport(report);
    }
	
	// 문제 오류 가져오기
	@Override
	public List<UserQuestionHistoryDTO> getReportQuestion(int offset, int size){
	    List<UserQuestionHistoryDTO> reports = playMapper.getReportQuestion(offset, size);

	    for (UserQuestionHistoryDTO report : reports) {
	        if (report.getImage_data() != null) {
	            report.setImage_data_base64(Base64.getEncoder().encodeToString(report.getImage_data()));
	            report.setImage_data(null);
	        }
	    }
	    return reports;
	}

	@Override
	public int getReportQuestionCount() {
		return playMapper.getReportQuestionCount();
	}
	
	@Override
	public void leavePanaltyZero(String user_nick) {
		playMapper.leavePanaltyZero(user_nick);
	}
	
}
