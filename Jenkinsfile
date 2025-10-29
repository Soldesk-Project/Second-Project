pipeline {
    agent any

    environment {
        DEPLOY_SERVER = "ubuntu@52.78.25.188"   // EC2 사용자@IP
        TOMCAT_WEBAPPS = "/opt/tomcat2/webapps" // Tomcat webapps 폴더
    }

    stage('Prepare Workspace') {
    steps {
        sh 'sudo chown -R jenkins:jenkins $WORKSPACE'
        sh 'sudo chmod -R 755 $WORKSPACE'
        }
    }

    stages {
        // 1. GitHub 레포 체크아웃
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Soldesk-Project/Second-Project.git',
                    credentialsId: 'GITHUB_TOKEN'
            }
        }

        // 2. React 프론트엔드 빌드 (second-project-react)
        stage('Build Frontend') {
            steps {
                dir('second-project-react') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        // 3. React 빌드 통합 (Spring WAR src/main/webapp)
        stage('Integrate Frontend into WAR') {
            steps {
                sh """
                # 기존 Spring src/main/webapp 디렉토리에 React 빌드 복사
                cp -r second-project-react/build/* Second_Project/src/main/webapp/
                """
            }
        }

        // 4. Maven 백엔드 빌드 (WAR)
        stage('Build Backend (Maven)') {
            steps {
                dir('Second_Project') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        // 5. EC2 Tomcat 배포
        stage('Deploy') {
            steps {
                sshagent(['DEPLOY_KEY']) {
                    sh """
                    # WAR 파일을 ROOT.war로 이름 변경
                    cp Second_Project/target/*.war Second_Project/target/ROOT.war

                    # EC2 webapps에 WAR 파일 전송
                    scp Second_Project/target/ROOT.war ${DEPLOY_SERVER}:${TOMCAT_WEBAPPS}/

                    # Tomcat 재시작
                    ssh ${DEPLOY_SERVER} 'sudo systemctl restart tomcat'
                    """
                }
            }
        }
    }

    post {
        success {
            echo '배포 성공 🎉'
        }
        failure {
            echo '배포 실패 ❌'
        }
    }
}
