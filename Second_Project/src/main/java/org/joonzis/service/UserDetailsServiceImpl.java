package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.UserInfoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService{
	@Autowired
    private UserService userService;
	
	@Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        // DB에서 유저 + 권한 조회 (UserVO 등에 role 필드를 포함시키세요)
        UserInfoDTO user = userService.getUserById(userId);
        if (user == null) throw new UsernameNotFoundException("No user");

        // DB에서 꺼낸 role 필드 사용
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(user.getAuth()));
        return new org.springframework.security.core.userdetails.User(
            user.getUser_id(),
            user.getUser_pw(),
            authorities
        );
	}
}
