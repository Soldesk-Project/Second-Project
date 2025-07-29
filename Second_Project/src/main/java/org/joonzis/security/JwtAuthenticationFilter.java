package org.joonzis.security;

import java.io.IOException;
import java.util.Arrays;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
	
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    
    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {

        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
    	
    	String requestURI = request.getRequestURI();	

//         여러개의 인증 예외 경로 처리
        String[] openEndpoints = {"/api/login", "/api/signUp", "/api/findId", "/api/findPw"};
        if (Arrays.stream(openEndpoints).anyMatch(requestURI::startsWith)) {
        	System.out.println("로그인관련");
            filterChain.doFilter(request, response);
            return;
        }
    	

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            String role = jwtUtil.getUserRoleFromToken(token);
            System.out.println("Token role from token: " + role);
            
           
            System.out.println("token -> " + token);
            try {
                if (!jwtUtil.validateToken(token)) {
                    filterChain.doFilter(request, response); // 유효하지 않은 토큰
                    return;
                }
                username = jwtUtil.getUserIdFromToken(token);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    System.out.println("UserDetails from DB: " + userDetails);
                    System.out.println("UserDetails authorities: " + userDetails.getAuthorities());
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                }
            } catch (Exception e) {
            	e.printStackTrace();
                // 모든 예외 발생시에도 흐름을 종료하지 않고 다음 필터로 넘김
                filterChain.doFilter(request, response);
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

}