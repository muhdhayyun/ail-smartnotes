from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    openrouter_api_key: str
    llm_model: str = "openai/gpt-4o-mini"
    chroma_dir: str = "./chroma_data"
    frontend_origin: str = "http://localhost:3000"
    upstash_vector_rest_url: str = ""
    upstash_vector_rest_token: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
