package org.joonzis.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserAchievementDTO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UserInfoDecoDTO;
import org.joonzis.domain.UserRewardVO;
import org.joonzis.domain.UsersVO;
import org.joonzis.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.log4j.Log4j;

@Log4j
@Service
public class UserServiceImpl implements UserService{
	
	private final Map<Integer, String> userServerMap = new ConcurrentHashMap<>();
	
	@Autowired
	private UserMapper mapper;	
	
	@Autowired
    private JavaMailSender mailSender;

	// Top 10 유저 랭킹 목록
	@Override
	public List<UserInfoDecoDTO> getUserRankingList() {
		return mapper.getUserRankingList();
	}
	
	// 모든 아이템 목록
	@Override
	public List<ItemVO> getItemList() {
		return mapper.getItemList();
	}
	// 인벤토리 - 카테고리별 아이템 목록
	public List<ItemVO> getInventoryCategory(Map<String, Object> paramMap) {
		return mapper.getInventoryCategory(paramMap);
	}
	// 보유 아이템 목록
	@Override
	public List<ItemVO> getInventory(int user_no) {
		return mapper.getInventory(user_no);
	}
	
	// 유저 장식 업데이트	
	@Override
	public boolean updateItem(UserDecoUpdateDTO UserDecoUpdateDTO) {
		return mapper.updateItem(UserDecoUpdateDTO);
	}
	
	// userNo로 유저 정보+css 찾기	
	@Override
	public UserInfoDecoDTO getUserInfoByUserNo(int userNo) {
		return mapper.getUserInfoByUserNo(userNo);
	}
	
	// 업적 달성 - 포인트 추가
	@Override
	public int updateUserPoint(UserAchievementDTO dto) {
		return mapper.updateUserPoint(dto);
	}
	
	
	// 아이템 구매 - 포인트 감소
	@Override
	public boolean userPointMinus(Map<String, Object> paramMap) {
		return mapper.userPointMinus(paramMap);
	}
	// 아이템 구매 - 인벤토리에 추가
	@Override
	public boolean buyItemInventory(Map<String, Object> paramMap) {
		return mapper.buyItemInventory(paramMap);
	}
	
	// 리워드 상태
	@Override
	public UserRewardVO getRewardStatus(int user_no) {
		return mapper.getRewardStatus(user_no);
	}
	// 리워드 상태 업데이트
	@Override
	public boolean rewardUpdate(UserRewardVO UserRewardVO) {
		return mapper.rewardUpdate(UserRewardVO);
	}
	// 리워드 보상 획득
	@Override
	public boolean addReward(UserDecoUpdateDTO UserDecoUpdateDTO) {
		return mapper.addReward(UserDecoUpdateDTO);
	}
	
	// 회원가입 - 닉네임 중복 확인
	@Override
	public boolean isUserNickTaken(String user_nick) {
		return mapper.isUserNickTaken(user_nick) == 1;
	}
	// 회원가입 - 아이디 중복 확인
	@Override
	public boolean isUserIdTaken(String user_id) {
		return mapper.isUserIdTaken(user_id) == 1;
	}
	// 회원가입 - 이메일 중복 확인
	@Override
	public boolean isUserEmailTaken(String user_email) {
		return mapper.isUserEmailTaken(user_email) == 1;
	}
	
	// 아이디 찾기
	@Override
	public String findIdByEmail(String user_email) {
		return mapper.findIdByEmail(user_email);
	}
	// 비밀번호 찾기
	@Override
	public String findPwByIdAndEmail(UsersVO vo) {
		return mapper.findPwByIdAndEmail(vo);
	}
	public void sendTempPassword(String toEmail, String tempPassword) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject("[CotePlay] 임시 비밀번호 안내");
        helper.setText("<p>안녕하세요.</p>"
            + "<p>임시 비밀번호: <b>" + tempPassword + "</b></p>"
            + "<p>로그인 후 반드시 비밀번호를 변경해 주세요.</p>", true);

        mailSender.send(message);
    }
	@Override
	public UserInfoDTO findUserByIdAndEmail(String id, String email) {
	    return mapper.findUserByIdAndEmail(id, email);
	}
	@Override
	public void updatePassword(UserInfoDTO user) {
		mapper.updatePassword(user);
	}
	
	// 유저 닉네임 변경
	public void updateNickname(Long user_no, String user_nick) {
		mapper.updateNickname(user_no, user_nick);
    }
	
	@Override
	@Transactional
	public int changeProfileImage(int userNo, String imageUrl) {
		int updated = mapper.updateProfileImage(userNo, imageUrl);
	    log.info("프로필 이미지 업데이트 건수: " + updated);
	    if (updated != 1) {
	      throw new IllegalStateException("프로필 이미지 업데이트 실패: userNo=" + userNo);
	    }
	    return updated;
	  }
	
	@Override
    public UsersVO getUsersByUserNo(int userNo) {
        return mapper.getUsersByUserNo(userNo);
    }
	
	@Override
	public void saveResetToken(String userId, String token) {
	    LocalDateTime expiry = LocalDateTime.now().plusMinutes(30); // 30분 후 만료
	    mapper.insertResetToken(userId, token, expiry);
	}
	@Override
	public UserInfoDTO findUserByToken(String token) {
	    return mapper.findUserByToken(token);
	}
	@Override
	public boolean tokenExpired(String token) {
	    LocalDateTime expiry = mapper.getExpiryByToken(token);
	    return expiry == null || expiry.isBefore(LocalDateTime.now());
	}
	@Override
	public void deleteResetToken(String token) {
	    mapper.deleteToken(token);
	}
	
	@Override
	public void sendResetLinkEmail(String toEmail, String resetLink) throws MessagingException {
		MimeMessage message = mailSender.createMimeMessage();
	    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

	    helper.setTo(toEmail);
	    helper.setSubject("[CotePlay] 비밀번호 재설정 링크");
	    helper.setText("<p>안녕하세요.</p>"
	        + "<p>비밀번호 재설정을 위해 아래 링크를 클릭하세요:</p>"
	        + "<p><a href='" + resetLink + "'>비밀번호 재설정하기</a></p>"
	        + "<p>이 링크는 30분간 유효합니다.</p>", true);

	    mailSender.send(message);
	}

}
