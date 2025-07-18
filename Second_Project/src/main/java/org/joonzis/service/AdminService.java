package org.joonzis.service;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UsersVO;

import java.util.List;
import java.util.Map;

public interface AdminService {
    
	//문제 관련 메소드
	//문제 등록 메소드
	void registerQuestion(QuestionDTO questionDTO, String category);
    //문제 검색 메소드
	Map<String, Object> searchQuestions(String category, String query, int page, int limit);
    //문제 수정 메소드
	void updateQuestion(QuestionDTO questionDTO, String category);
	//문제 삭제 메소드
	void deleteQuestions(String decodedCategory, List<Integer> questionIds);

	//유저 관련 메소드
	//유저 조회 메소드
	List<UsersVO> getAllUsers();
	//유저 검색 메소드
	List<UsersVO> searchUsers(String searchType, String searchValue);
	//유저 채금 적용 메소드
	int banChatusers(List<Integer> userNos);
    //유저 채금 해제 메소드
	void unbanChatUsers();
}