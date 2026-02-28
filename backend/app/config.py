from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Server Configuration
    port: int = 3001
    host: str = "0.0.0.0"
    environment: str = "development"
    
    # AWS Configuration
    aws_region: str = "us-east-1"
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_session_token: str | None = None
    
    # AWS RDS PostgreSQL Configuration
    db_host: str
    db_port: int = 5432
    db_name: str
    db_user: str
    db_password: str
    db_ssl: bool = True
    
    # AWS Cognito Configuration
    cognito_user_pool_id: str
    cognito_client_id: str
    cognito_issuer: str
    
    # AWS IoT Core
    aws_iot_endpoint: str
    
    # AWS S3
    s3_bucket_name: str
    
    # OpenAI (Phase 5)
    openai_api_key: str | None = None
    
    @property
    def database_url(self) -> str:
        """Construct PostgreSQL connection URL"""
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    @property
    def async_database_url(self) -> str:
        """Construct async PostgreSQL connection URL"""
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
