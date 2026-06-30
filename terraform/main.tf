# -----------------------------------------------------------------------------------------
# BLUEPRINT TERRAFORM - Déploiement Cloud (AWS) pour Driving School ERP
# -----------------------------------------------------------------------------------------
# Ce fichier démontre l'architecture Infrastructure-as-Code (IaC).
# Il provisionne une instance EC2 avec les Security Groups nécessaires pour exécuter Docker.

provider "aws" {
  region = "eu-west-3" # Paris
}

# --- Security Group (Pare-feu Cloud AWS) ---
resource "aws_security_group" "erp_sg" {
  name        = "erp_security_group"
  description = "Autoriser le trafic HTTP et SSH"

  # Port 80 (HTTP) ouvert à internet pour Nginx/ModSecurity
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Port 22 (SSH) pour l'administration sécurisée
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # En production, limiter à votre IP
  }

  # Tout autoriser en sortie
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- Serveur Cloud (EC2 Instance) ---
resource "aws_instance" "erp_server" {
  ami           = "ami-0b4457e5b38ed6b23" # Ubuntu 24.04 LTS (eu-west-3)
  instance_type = "t3.medium"             # 2 vCPUs, 4GB RAM (Recommandé pour Spring Boot + Redis + Postgres)
  
  security_groups = [aws_security_group.erp_sg.name]
  key_name        = "my-aws-key"

  # Script d'initialisation (User Data) - Exécuté au 1er démarrage
  user_data = <<-EOF
              #!/bin/bash
              # Mise à jour
              apt-get update -y
              
              # Installation de Docker & Docker Compose
              apt-get install docker.io docker-compose -y
              systemctl start docker
              systemctl enable docker

              # Clonage du projet
              git clone https://github.com/AymanTN1/drivingSchool.git /opt/erp
              cd /opt/erp
              
              # Configuration environnement
              cp .env.example .env
              
              # Lancement de l'infrastructure DevSecOps
              docker-compose up --build -d
              EOF

  tags = {
    Name        = "DrivingSchool-Production"
    Environment = "Prod"
    Project     = "ERP"
  }
}

# --- Output : Adresse IP du serveur ---
output "website_url" {
  description = "L'adresse IP publique de l'ERP"
  value       = "http://${aws_instance.erp_server.public_ip}"
}
