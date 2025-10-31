import importlib
from types import SimpleNamespace
from typing import List

import pytest


def _reload_email_module(monkeypatch, **env_overrides):
    """Reload the email service module with temporary environment overrides."""
    module_name = "core.services.email"

    # Clear cached module so overrides take effect
    import sys

    if module_name in sys.modules:
        del sys.modules[module_name]

    for key, value in env_overrides.items():
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)

    email_module = importlib.import_module(module_name)
    importlib.reload(email_module)
    return email_module


class FakeMailtrapClient:
    def __init__(self):
        self.sent: List[SimpleNamespace] = []

    def send(self, mail):
        self.sent.append(mail)
        return {"id": "test-mail"}


class FakeAddress:
    def __init__(self, email: str, name: str):
        self.email = email
        self.name = name


class FakeMail:
    def __init__(self, **kwargs):
        self.data = kwargs


@pytest.fixture
def patched_email_module(monkeypatch):
    fake_client = FakeMailtrapClient()

    email_module = _reload_email_module(
        monkeypatch,
        MAILTRAP_API_TOKEN="token",
        MAILTRAP_SENDER_EMAIL="noreply@example.com",
        MAILTRAP_SENDER_NAME="Prophet Team",
        MAILTRAP_APP_NAME="Prophet",
        MAILTRAP_COMPANY_NAME="Milo",
        MAILTRAP_APP_URL="https://prophet.build",
        MAILTRAP_BRANDING_LOGO_URL="https://example.com/logo.png",
        MAILTRAP_DISCORD_URL="https://discord.gg/example",
        MAILTRAP_CALENDAR_URL="https://cal.com/team/example/demo",
        MAILTRAP_WELCOME_FORM_URL="https://example.com/form",
        MAILTRAP_WELCOME_DISCOUNT_CODE="DISCOUNT20",
    )

    # Patch Mailtrap client classes used by the service
    monkeypatch.setattr(email_module.mt, "MailtrapClient", lambda token: fake_client)
    monkeypatch.setattr(email_module.mt, "Address", FakeAddress)
    monkeypatch.setattr(email_module.mt, "Mail", FakeMail)

    service = email_module.EmailService()
    service.client = fake_client

    return SimpleNamespace(module=email_module, service=service, client=fake_client)


def test_send_welcome_email_requires_configuration(monkeypatch):
    email_module = _reload_email_module(monkeypatch, MAILTRAP_API_TOKEN=None)
    service = email_module.EmailService()

    assert service.client is None
    assert service.send_welcome_email("user@example.com") is False


def test_send_welcome_email_uses_mailtrap(patched_email_module):
    service = patched_email_module.service
    client = patched_email_module.client

    result = service.send_welcome_email("user@example.com", "User")

    assert result is True
    assert len(client.sent) == 1
    mail = client.sent[0]
    assert mail.data["subject"].startswith("🎉 Welcome to Prophet")
    assert mail.data["category"] == "welcome"
    assert mail.data["to"][0].name == "User"


def test_send_team_invite_email_infers_name(patched_email_module):
    service = patched_email_module.service
    client = patched_email_module.client

    result = service.send_team_invite_email(
        invitee_email="teammate@example.com",
        invitee_name=None,
        team_name="Dream Team",
        inviter_name="Alice",
        invite_link="https://example.com/invite",
    )

    assert result is True
    assert len(client.sent) == 1
    mail = client.sent[0]
    assert mail.data["category"] == "team_invite"
    assert mail.data["to"][0].name == "Teammate"
