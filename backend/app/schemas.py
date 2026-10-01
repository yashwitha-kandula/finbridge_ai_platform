from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    category: str = Field(min_length=2, max_length=50)
    description: str = Field(max_length=200)


class ExpenseUpdate(BaseModel):
    amount: float = Field(gt=0)
    category: str = Field(min_length=2, max_length=50)
    description: str = Field(max_length=200)