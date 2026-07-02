from __future__ import annotations

from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field


T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    status: int
    message: str
    data: T | dict[str, Any] | list[Any] | None = None


class ProjectDocument(BaseModel):
    title: str = "照片黏貼表"


class Crop(BaseModel):
    x: float = 0
    y: float = 0
    width: float = 1
    height: float = 1
    unit: Literal["ratio"] = "ratio"


class Asset(BaseModel):
    id: str
    file: str
    mime: str = "image/webp"
    width: int = 0
    height: int = 0
    original_name: str | None = Field(default=None, alias="originalName")
    size: int = 0

    model_config = {"populate_by_name": True}


class Item(BaseModel):
    id: str
    type: Literal["image"] = "image"
    asset_id: str = Field(alias="assetId")
    remark: str = ""
    rotation: int = 0
    crop: Crop = Field(default_factory=Crop)
    portrait_size: Literal["large", "small"] = Field(default="large", alias="portraitSize")

    model_config = {"populate_by_name": True}


def _default_layout() -> list["WordCompatibleGridLayout"]:
    return [
        WordCompatibleGridLayout(
            id="layout_word_default",
            item_order=[],
        )
    ]


class WordCompatibleGridLayout(BaseModel):
    id: str
    type: Literal["word-compatible-grid"] = "word-compatible-grid"
    item_order: list[str] = Field(default_factory=list, alias="itemOrder")

    model_config = {"populate_by_name": True}


class ProjectV2(BaseModel):
    project_schema: str = Field(default="image-pigeon.project", alias="schema")
    version: int = 2
    document: ProjectDocument = Field(default_factory=ProjectDocument)
    assets: list[Asset] = Field(default_factory=list)
    items: list[Item] = Field(default_factory=list)
    layouts: list[WordCompatibleGridLayout] = Field(default_factory=_default_layout)

    model_config = ConfigDict(populate_by_name=True, protected_namespaces=())

    @property
    def schema(self) -> str:
        return self.project_schema
