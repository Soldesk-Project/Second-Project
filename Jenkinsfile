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
                sshagent(['DEPLOY_KEY']) {
                    sh """
                    scp Second_Project/target/ROOT.war ${DEPLOY_SERVER}:${TOMCAT_WEBAPPS}/
                    ssh ${DEPLOY_SERVER} '
                        cd /opt/tomcat2/bin &&
                        ./shutdown.sh &&
                        ./startup.sh
                    '
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
