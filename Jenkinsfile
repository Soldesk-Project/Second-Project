pipeline {
    agent any

    environment {
        DEPLOY_SERVER = "ubuntu@52.78.25.188"
        TOMCAT_WEBAPPS = "/opt/tomcat2/webapps"
    }

    stages {
        stage('Prepare Workspace') {
            steps {
                sh 'sudo chown -R jenkins:jenkins $WORKSPACE'
                sh 'sudo chmod -R 755 $WORKSPACE'
            }
        }

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Soldesk-Project/Second-Project.git',
                    credentialsId: 'GITHUB_TOKEN'
            }
        }

        stage('Build Frontend') {
            steps {
                dir('second-project-react') {
                    sh 'npm install'
                    sh 'CI=false npm run build'
                }
            }
        }

        stage('Integrate Frontend into WAR') {
            steps {
                sh 'cp -r second-project-react/build/* Second_Project/src/main/webapp/'
            }
        }

        stage('Build Backend (Maven)') {
            steps {
                dir('Second_Project') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Deploy') {
            steps {
                sh """
                # WAR 파일을 ROOT.war로 복사
                sudo cp Second_Project/target/controller-1.0.0-BUILD-SNAPSHOT.war /opt/tomcat2/webapps/ROOT.war
        
                # 톰캣 재시작
                sudo /opt/tomcat2/bin/shutdown.sh
                sudo /opt/tomcat2/bin/startup.sh
                """
            }
        }

        stage("Permission) {
            steps {
                sh """
                # 배포 파일 권한 부여
                sudo chmod -R 755 /opt/tomcat2/webapps/ROOT

                # Ojdbc6.jar 복사
                sudo cp ~/ojdbc6.jar /opt/tomcat2/webapps/ROOT/WEB-INF/lib/
                sudo chmod 644 /opt/tomcat2/webapps/ROOT/WEB-INF/lib/ojdbc6.jar

                #application.properties 복사
                sudo cp ~/application.properties /opt/tomcat2/webapps/ROOT/WEB-INF/lib/classes/

                # 톰캣 재시작
                sudo /opt/tomcat2/bin/shutdown.sh
                sudo /opt/tomcat2/bin/startup.sh
                """
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
