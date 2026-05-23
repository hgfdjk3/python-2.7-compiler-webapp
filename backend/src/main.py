import os
import sys
import asyncio
import argparse
import logging

# Ensure the root backend directory is in the path so package imports resolve correctly
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Remove the current directory (src/) from sys.path to prevent shadowing
# the third-party 'mcp' library with the local 'src/mcp' package.
src_dir = os.path.dirname(os.path.abspath(__file__))
while src_dir in sys.path:
    sys.path.remove(src_dir)


from src.services.harness.runner import AgentRunner
from src.config import OPENAI_API_KEY
from src.api.routes.connectors import CONNECTORS_DB
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

# Configure logging
def setup_logging(verbose: bool):
    level = logging.INFO if verbose else logging.WARNING
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
    if not verbose:
        logging.getLogger("agent_runner").setLevel(logging.WARNING)
        logging.getLogger("mcp_client_manager").setLevel(logging.WARNING)

async def run_interactive(runner: AgentRunner, system_instruction: str = None):
    print("\n" + "="*60)
    print("      Atom LangGraph Agent Interactive Console      ")
    print("="*60)
    print("Type your message and press Enter.")
    print("Commands: 'exit' or 'quit' to end the session.")
    print(f"Model: {runner.model_name}")
    print(f"Configured MCP Servers: {list(runner.mcp_configs.keys())}")
    print("="*60 + "\n")

    thread_id = "default_cli_session"
    
    while True:
        try:
            user_input = input("\nYou: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("exit", "quit"):
                print("Goodbye!")
                break
                
            print("\nAgent: ", end="", flush=True)
            
            async for event in runner.stream_run(
                thread_id=thread_id,
                message=user_input,
                system_instruction=system_instruction
            ):
                # Handle chatbot output
                if "chatbot" in event:
                    chatbot_data = event["chatbot"]
                    if "messages" in chatbot_data:
                        for msg in chatbot_data["messages"]:
                            if isinstance(msg, AIMessage):
                                if msg.content:
                                    print(msg.content)
                                if msg.tool_calls:
                                    for tc in msg.tool_calls:
                                        print(f"\n[Tool Call] Invoke tool: '{tc['name']}' with arguments: {tc['args']}")
                
                # Handle tool execution output
                elif "tools" in event:
                    tools_data = event["tools"]
                    if "messages" in tools_data:
                        for msg in tools_data["messages"]:
                            if isinstance(msg, ToolMessage):
                                print(f"[Tool Response] Tool '{msg.name}' returned: {msg.content}")

        except KeyboardInterrupt:
            print("\nExiting session...")
            break
        except Exception as e:
            print(f"\nError occurred: {e}")

async def run_single(runner: AgentRunner, message: str, system_instruction: str = None):
    thread_id = "single_query_session"
    try:
        async for event in runner.stream_run(
            thread_id=thread_id,
            message=message,
            system_instruction=system_instruction
        ):
            if "chatbot" in event:
                chatbot_data = event["chatbot"]
                for msg in chatbot_data.get("messages", []):
                    if isinstance(msg, AIMessage):
                        if msg.content:
                            print(f"\nAgent: {msg.content}")
                        if msg.tool_calls:
                            for tc in msg.tool_calls:
                                print(f"[Tool Call] {tc['name']}({tc['args']})")
            elif "tools" in event:
                tools_data = event["tools"]
                for msg in tools_data.get("messages", []):
                    if isinstance(msg, ToolMessage):
                        print(f"[Tool Response] {msg.name} -> {msg.content}")
    except Exception as e:
        print(f"Error: {e}")

async def main():
    # Check if NVIDIA API key is used and set appropriate defaults
    api_key = OPENAI_API_KEY or ""
    default_model = "gpt-4o-mini"
    
    if api_key.startswith("nvapi-"):
        default_model = "meta/llama-3.1-70b-instruct"

    parser = argparse.ArgumentParser(description="Run the Atom LangGraph Agent.")
    parser.add_argument("--message", "-m", type=str, help="Run a single message and exit.")
    parser.add_argument("--model", type=str, default=default_model, help="Model name to use (defaults to meta/llama-3.1-70b-instruct for nvapi keys).")
    parser.add_argument("--temperature", type=float, default=0.7, help="LLM temperature.")
    parser.add_argument("--system", type=str, default=None, help="System instruction / prompt override.")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging.")
    
    args = parser.parse_args()
    setup_logging(args.verbose)
    
    # Warn user if API key is missing
    if not OPENAI_API_KEY:
        print("WARNING: 'OPENAI_API_KEY' environment variable not set.")
        print("Please configure it in a '.env' file in the 'backend' directory.")
        print("Example contents of backend/.env:")
        print("OPENAI_API_KEY=your_openai_api_key_here\n")
    
    # Instantiate the agent runner
    runner = AgentRunner(
        mcp_configs=CONNECTORS_DB,
        model_name=args.model,
        temperature=args.temperature
    )
    
    if args.message:
        await run_single(runner, args.message, args.system)
    else:
        await run_interactive(runner, args.system)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
