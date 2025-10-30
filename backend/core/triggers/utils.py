import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import croniter
import pytz

from core.utils.logger import logger


class TriggerError(Exception):
    pass


class ConfigurationError(TriggerError):
    pass


class ProviderError(TriggerError):
    pass


def get_next_run_time(cron_expression: str, user_timezone: str) -> Optional[datetime]:
    try:
        tz = pytz.timezone(user_timezone)
        now_local = datetime.now(tz)

        cron = croniter.croniter(cron_expression, now_local)

        next_run_local = cron.get_next(datetime)
        next_run_utc = next_run_local.astimezone(timezone.utc)

        return next_run_utc

    except Exception as e:
        logger.error(f"Error calculating next run time: {e}")
        return None


def get_human_readable_schedule(cron_expression: str, user_timezone: str) -> str:
    try:
        patterns = {
            "*/5 * * * *": "Every 5 minutes",
            "*/10 * * * *": "Every 10 minutes",
            "*/15 * * * *": "Every 15 minutes",
            "*/30 * * * *": "Every 30 minutes",
            "0 * * * *": "Every hour",
            "0 */2 * * *": "Every 2 hours",
            "0 */4 * * *": "Every 4 hours",
            "0 */6 * * *": "Every 6 hours",
            "0 */12 * * *": "Every 12 hours",
            "0 0 * * *": "Daily at midnight",
            "0 9 * * *": "Daily at 9:00 AM",
            "0 12 * * *": "Daily at 12:00 PM",
            "0 18 * * *": "Daily at 6:00 PM",
            "0 9 * * 1-5": "Weekdays at 9:00 AM",
            "0 9 * * 1": "Every Monday at 9:00 AM",
            "0 9 * * 2": "Every Tuesday at 9:00 AM",
            "0 9 * * 3": "Every Wednesday at 9:00 AM",
            "0 9 * * 4": "Every Thursday at 9:00 AM",
            "0 9 * * 5": "Every Friday at 9:00 AM",
            "0 9 * * 6": "Every Saturday at 9:00 AM",
            "0 9 * * 0": "Every Sunday at 9:00 AM",
            "0 9 1 * *": "Monthly on the 1st at 9:00 AM",
            "0 9 15 * *": "Monthly on the 15th at 9:00 AM",
            "0 9,17 * * *": "Daily at 9:00 AM and 5:00 PM",
            "0 10 * * 0,6": "Weekends at 10:00 AM",
        }

        if cron_expression in patterns:
            description = patterns[cron_expression]
            if user_timezone != "UTC":
                description += f" ({user_timezone})"
            return description

        parts = cron_expression.split()
        if len(parts) != 5:
            return f"Custom schedule: {cron_expression}"

        minute, hour, day, month, weekday = parts

        if minute.isdigit() and hour == "*" and day == "*" and month == "*" and weekday == "*":
            return f"Every hour at :{minute.zfill(2)}"

        if minute.isdigit() and hour.isdigit() and day == "*" and month == "*" and weekday == "*":
            time_str = f"{hour.zfill(2)}:{minute.zfill(2)}"
            description = f"Daily at {time_str}"
            if user_timezone != "UTC":
                description += f" ({user_timezone})"
            return description

        if minute.isdigit() and hour.isdigit() and day == "*" and month == "*" and weekday == "1-5":
            time_str = f"{hour.zfill(2)}:{minute.zfill(2)}"
            description = f"Weekdays at {time_str}"
            if user_timezone != "UTC":
                description += f" ({user_timezone})"
            return description

        return f"Custom schedule: {cron_expression}"

    except Exception:
        return f"Custom schedule: {cron_expression}"


def _safe_get(step: Dict[str, Any], key: str, default: Any = None) -> Any:
    value = step.get(key, default)
    return value if value is not None else default


def _normalise_step_children(step: Dict[str, Any]) -> List[Dict[str, Any]]:
    children = step.get("children") or step.get("steps") or []
    return [child for child in children if isinstance(child, dict)]


class WorkflowParser:
    """Parse workflow builder JSON into a flattened, LLM-friendly structure."""

    def __init__(self) -> None:
        self.step_counter = 0

    def parse_workflow_steps(self, steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        self.step_counter = 0

        start_node = next(
            (
                step
                for step in steps
                if step.get("name") == "Start"
                and step.get("description")
                == "Click to add steps or use the Add Node button"
            ),
            None,
        )

        if start_node and "children" in start_node:
            filtered_steps = _normalise_step_children(start_node)
        else:
            filtered_steps = steps

        return self._parse_steps_recursive(filtered_steps)

    def _parse_steps_recursive(self, steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        result: List[Dict[str, Any]] = []
        processed_ids: set[str] = set()

        for step in steps:
            if not isinstance(step, dict):
                continue

            step_id = step.get("id") or step.get("uuid") or str(id(step))
            if step_id in processed_ids:
                continue

            step_type = _safe_get(step, "type", "action")
            parent_conditional_id = step.get("parentConditionalId")

            if step_type == "condition" and not parent_conditional_id:
                conditional_group = [step]

                for other_step in steps:
                    if not isinstance(other_step, dict):
                        continue
                    if other_step.get("parentConditionalId") == step_id:
                        conditional_group.append(other_step)

                conditional_group.sort(key=self._get_condition_order)

                parsed_group = self._parse_conditional_group(conditional_group)
                if parsed_group:
                    result.append(parsed_group)

                for group_step in conditional_group:
                    processed_ids.add(group_step.get("id"))
                continue

            if step_type == "condition" and parent_conditional_id:
                processed_ids.add(step_id)
                continue

            parsed_step = self._parse_single_step(step)
            if parsed_step:
                result.append(parsed_step)
            processed_ids.add(step_id)

        return result

    def _parse_single_step(self, step: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        step_id = step.get("id") or step.get("uuid")
        if not step_id:
            return None

        self.step_counter += 1

        parsed_children = self._parse_steps_recursive(_normalise_step_children(step))

        return {
            "id": step_id,
            "counter": self.step_counter,
            "type": _safe_get(step, "type", "action"),
            "name": _safe_get(step, "name", f"Step {self.step_counter}"),
            "description": step.get("description"),
            "action": step.get("action"),
            "config": step.get("config", {}),
            "children": parsed_children,
            "parentConditionalId": step.get("parentConditionalId"),
        }

    def _parse_conditional_group(
        self, steps: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        if not steps:
            return None

        root = steps[0]
        group_id = root.get("id") or root.get("uuid")
        if not group_id:
            return None

        branch_nodes: List[Dict[str, Any]] = []
        for branch_step in steps:
            branch_type = branch_step.get("conditionType") or branch_step.get("variant")
            if not branch_type:
                if branch_step is root:
                    branch_type = "if"
                elif branch_step.get("name", "").lower().startswith("else"):
                    branch_type = "else"
                else:
                    branch_type = "elseif"

            branch_nodes.append(
                {
                    "id": branch_step.get("id"),
                    "type": branch_type,
                    "label": self._format_condition_label(branch_step, branch_type),
                    "children": self._parse_steps_recursive(
                        _normalise_step_children(branch_step)
                    ),
                }
            )

        return {
            "id": group_id,
            "type": "conditional_group",
            "branches": branch_nodes,
        }

    @staticmethod
    def _get_condition_order(step: Dict[str, Any]) -> int:
        variant = step.get("conditionType") or step.get("variant")
        if not variant and step.get("name"):
            name_lower = step["name"].lower()
            if "else if" in name_lower or "elseif" in name_lower:
                variant = "elseif"
            elif name_lower.startswith("else"):
                variant = "else"
        order_map = {"if": 0, "elseif": 1, "else": 2}
        return order_map.get(variant or "elseif", 1)

    @staticmethod
    def _format_condition_label(step: Dict[str, Any], variant: str) -> str:
        label = step.get("name") or step.get("label")
        condition = step.get("condition") or step.get("expression")

        if condition:
            try:
                rendered = json.dumps(condition, ensure_ascii=False)
            except TypeError:
                rendered = str(condition)
            return f"{variant.upper()}: {rendered}"

        if label:
            return f"{variant.upper()}: {label}"

        return variant.upper()


def is_playbook(workflow: Optional[Dict[str, Any]]) -> bool:
    if not workflow:
        return False

    template_type = str(workflow.get("templateType") or workflow.get("type") or "").lower()
    if template_type == "playbook":
        return True

    metadata = workflow.get("metadata") or {}
    if isinstance(metadata, dict) and str(metadata.get("kind", "")).lower() == "playbook":
        return True

    return bool(workflow.get("sections"))


def format_playbook_for_llm(workflow: Dict[str, Any]) -> str:
    sections = workflow.get("sections") or []
    lines: List[str] = []
    title = workflow.get("name") or "Playbook"
    lines.append(f"Playbook: {title}")

    for idx, section in enumerate(sections, start=1):
        if not isinstance(section, dict):
            continue
        header = section.get("title") or f"Section {idx}"
        summary = section.get("summary") or section.get("description")
        lines.append(f"  {idx}. {header}")
        if summary:
            lines.append(f"     - {summary}")
        steps = section.get("steps") or []
        for step_idx, step in enumerate(steps, start=1):
            if isinstance(step, dict):
                label = step.get("title") or step.get("name") or f"Step {step_idx}"
                details = step.get("description") or step.get("body")
                lines.append(f"       {step_idx}. {label}")
                if details:
                    lines.append(f"          - {details}")
            else:
                lines.append(f"       {step_idx}. {step}")

    return "\n".join(lines).strip()


def format_workflow_for_llm(workflow: Dict[str, Any]) -> str:
    if not workflow:
        return ""

    if is_playbook(workflow):
        return format_playbook_for_llm(workflow)

    parser = WorkflowParser()
    parsed_steps = parser.parse_workflow_steps(workflow.get("steps", []))

    lines: List[str] = []
    title = workflow.get("name") or "Workflow"
    lines.append(f"Workflow: {title}")

    def _render_steps(steps: List[Dict[str, Any]], depth: int = 1, prefix: str = "") -> None:
        for index, step in enumerate(steps, start=1):
            bullet = f"{prefix}{index}."
            indent = "  " * depth

            if step.get("type") == "conditional_group":
                lines.append(f"{indent}{bullet} Conditional Branch")
                for branch_idx, branch in enumerate(step.get("branches", []), start=1):
                    branch_label = branch.get("label") or branch.get("type")
                    lines.append(f"{indent}    - {branch_label}")
                    _render_steps(branch.get("children", []), depth + 2, f"{bullet}{branch_idx}.")
                continue

            name = step.get("name") or step.get("description") or step.get("action")
            if not name:
                name = f"Step {bullet.strip('.')}"

            lines.append(f"{indent}{bullet} {name}")

            description = step.get("description")
            if description:
                lines.append(f"{indent}    - {description}")

            action = step.get("action")
            if action:
                lines.append(f"{indent}    - Action: {action}")

            if step.get("children"):
                _render_steps(step["children"], depth + 1, f"{bullet}")

    _render_steps(parsed_steps)

    return "\n".join(lines).strip()

