package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UserQuestionHistoryDTO;

public interface PlayService {
	
	// 카테고리 별 문제 가져오기
	List<QuestionDTO> getQuestionsByCategory(String category);
	
	public void increaseRewardPoints(int point, int rank_point, String user_nick);
	
	public void saveUserHistory(List<UserQuestionHistoryDTO> historyList);
	
	public void countFirst(String user_nick);
	
	public void leavePanalty(String user_nick);
	
	public List<UserQuestionHistoryDTO> getQuestionReviewList(String user_nick);
	
	public List<UserQuestionHistoryDTO> getUserQuestionHistory(String submittedAt);
	
	public void saveReport(UserQuestionHistoryDTO report);
	
	public List<UserQuestionHistoryDTO> getReportQuestion(int offset, int size);
	
	public int getReportQuestionCount();

	public void leavePanaltyZero(String user_nick);
}
