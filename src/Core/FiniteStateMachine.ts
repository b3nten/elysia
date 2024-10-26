import { ReverseMap } from "../Containers/ReverseMap.ts";
import { ELYSIA_LOGGER } from "./Logger.ts";
import { isFunction, isPropertyKey } from "./Asserts.ts";

const ExitCurrentState = Symbol.for("Elysia::FiniteStateMachine::ExitCurrentState");
const onEnter = Symbol.for("Elysia::FiniteStateMachine::onEnter");
const onExit = Symbol.for("Elysia::FiniteStateMachine::onExit");
const onCanExit = Symbol.for("Elysia::FiniteStateMachine::onCanExit");
const onUpdate = Symbol.for("Elysia::FiniteStateMachine::onUpdate");
const Actions = Symbol.for("Elysia::FiniteStateMachine::Actions");
const To = Symbol.for("Elysia::FiniteStateMachine::To");
const From = Symbol.for("Elysia::FiniteStateMachine::From");
const Event = Symbol.for("Elysia::FiniteStateMachine::Event");
const Condition = Symbol.for("Elysia::FiniteStateMachine::Condition");
const GetMatchingTransition = Symbol.for("Elysia::FiniteStateMachine::GetMatchingTransition");
const RunTransition = Symbol.for("Elysia::FiniteStateMachine::RunTransition");
const ProvidedUpdate = Symbol.for("Elysia::FiniteStateMachine::providedUpdate");

interface StateConstructorArguments
{
	/**
	 * Function to be called when the state is entered.
	 */
	onEnter?: () => void;
	/**
	 * Function to be called when the state is exited.
	 */
	onExit?: () => void;
	/**
	 * Function to be called when the state is updated.
	 */
	onUpdate?: (delta: number, elapsed: number) => void;
	/**
	 *	Function to be called when the state is exited.
	 */
	onCanExit?: () => boolean;
	/**
	 * Actions that can be called on the state.
	 */
	actions?: Record<PropertyKey, Function>;
}

/**
 * Represents a state in a finite state machine.
 */
export class State
{
	constructor(args: StateConstructorArguments)
	{
		this[onEnter] = args.onEnter;
		this[onExit] = args.onExit;
		this[onUpdate] = args.onUpdate;
		this[onCanExit] = args.onCanExit;
		this[Actions] = new Map(Object.entries(args.actions ?? {}));
	}

	/**
	 * Adds an action to the state. This function will be triggered if the state is active
	 * when `fsm.callAction` function is called with the same action name.
	 * @param action
	 * @param callback
	 */
	public addAction(action: PropertyKey, callback: Function) { this[Actions].set(action, callback); }

	/** @internal */
	[Actions]: Map<PropertyKey, Function>;
	/** @internal */
	[onEnter]?: () => void;
	/** @internal */
	[onExit]?: () => void | Promise<void>;
	/** @internal */
	[onCanExit]?: () => boolean;
	/** @internal */
	[onUpdate]?: (delta: number, elapsed: number) => void;
}

interface TransitionConstructorArguments
{
	/**
	 * The state to transition to.
	 */
	to: PropertyKey;
	/**
	 * The state to transition from. If omitted, the transition will be considered global.
	 */
	from?: PropertyKey;
	/**
	 * The condition to be met for the transition to occur. If a PropertyKey is provided, it will be treated as an event.
	 */
	condition?: Function;
	/**
	 * The event to trigger the transition.
	 */
	event?: PropertyKey;
}

/**
 * Represents a transition in a finite state machine.
 */
export class Transition
{
	constructor(args: TransitionConstructorArguments)
	{
		this[To] = args.to;
		this[From] = args.from;
		this[Condition] = args.condition;
		this[Event] = args.event;
	}

	/** @internal */
	[To]: PropertyKey;
	/** @internal */
	[From]?: PropertyKey;
	/** @internal */
	[Condition]?: Function;
	/** @internal */
	[Event]?: PropertyKey;
}

export interface FiniteStateMachineConstructorArguments
{
	onEnter?: () => void;
	onExit?: () => void;
	onCanExit?: () => boolean;
	onUpdate?: (delta: number, elapsed: number) => void;
}

/**
 * Represents a finite state machine. Can be used to create complex hierarchical state.
 * The machine can be used with both a polling approach by calling onUpdate(), and an event based approach
 * by calling fireEvent().
 */
export class FiniteStateMachine
{
	constructor(args: FiniteStateMachineConstructorArguments = {})
	{
		this[onEnter] = args.onEnter;
		this[onExit] = args.onExit;
		this[onCanExit] = args.onCanExit;
		this[ProvidedUpdate] = args.onUpdate;
	}

	/**
	 * Initializes the state machine.
	 */
	public init(): this
	{
		if(!this.startingState)
		{
			ELYSIA_LOGGER.error("No starting state provided for FiniteStateMachine.");
			return this;
		}
		this.currentState = this.states.get(this.startingState)!;
		this[onEnter]?.();
		this.currentState?.[onEnter]?.();
		this.initialized = true;

		if(this.currentState instanceof FiniteStateMachine) this.currentState.init();

		return this;
	}

	/**
	 * Updates the state machine and runs it's logic.
	 * @param delta
	 * @param elapsed
	 */
	public onUpdate(delta: number, elapsed: number)
	{
		this[onUpdate]?.(delta, elapsed);
	}

	/**
	 * Adds a state to the state machine.
	 * @param name
	 * @param state
	 */
	public addState(name: PropertyKey, state: State | FiniteStateMachine | StateConstructorArguments): this
	{
		if(!(state instanceof State) && !(state instanceof FiniteStateMachine))
			state = new State(state);

		this.states.set(name, state as State | FiniteStateMachine);
		if(!this.startingState) this.startingState = name;

		return this;
	}

	/**
	 * Adds a transition to the state machine.
	 * If the from field is omitted the transition will be considered global, meaning
	 * it can be triggered from any state and has a higher priority than transitions with a `from` field.
	 * @param t
	 */
	public addTransition(t: Transition | TransitionConstructorArguments): this
	{
		if(!(t instanceof Transition))
			t = new Transition(t);

		if(t[Event])
		{
			if(t[From])
			{
				if(!this.eventTransitions.has(t[Event])) this.eventTransitions.set(t[Event], new Set([t]));
				else this.eventTransitions.get(t[Event])!.add(t);
			}
			else
			{
				if(!this.globalEventTransitions.has(t[Event])) this.eventTransitions.set(t[Event], new Set([t]));
				else this.globalEventTransitions.get(t[Event])!.add(t);
			}
		}
		else
		{
			this.transitions.add(t);
		}

		return this;
	}

	/**
	 * Get the active hierarchy path of the state machine.
	 */
	public getActiveHierarchyPath(): PropertyKey[]
	{
		const path = [this.states.getKey(this.currentState)!];
		let current = this.currentState;
		while(current instanceof FiniteStateMachine)
		{
			const state = current.states.getKey(current.currentState)!;
			path.push(state);
			current = current.currentState;
		}
		return path;
	}

	/**
	 * Set the state of the state machine directly.
	 * @param name
	 * @param instant If true, the state will be set without waiting for an exit function.
	 */
	public setState(name: PropertyKey, instant = false): this
	{
		const to = this.states.get(name);
		if(!to) ELYSIA_LOGGER.error("Invalid state.");
		else
		{
			if(!instant)
				this[RunTransition](this.states.getKey(this.currentState), name)
			else
			{
				this[ExitCurrentState]();
				this.currentState = to;
				this.currentState[onEnter]?.();
			}
		}
		return this;
	}

	/**
	 * Call an action on the current state.
	 * @param action
	 * @param recurse
	 */
	public callAction(action: PropertyKey, ...args: any[]): this
	{
		if(this.currentState[Actions].has(action))
			this.currentState[Actions].get(action)!(...args);

		if(this.currentState instanceof FiniteStateMachine)
			this.currentState.callAction(action, ...args);

		return this;
	}

	/**
	 * Fire an event on the state machine.
	 * @param event
	 */
	public fireEvent(event: PropertyKey): this
	{
		const transitions = this.globalEventTransitions.get(event) ?? this.eventTransitions.get(event)

		if(!transitions) return this;

		for(const t of transitions)
		{
			if(
				// if the transition has a from field, we check if the current state matches
				(t[From] === undefined || this.states.getKey(this.currentState) === t[From])
				// if the transition has an event field, we check if the event matches
				&& (isPropertyKey(t[Event]) && t[Event] === event)
				// if the transition has a condition, we check if it is met
				&& ((isFunction(t[Condition]) && t[Condition]()) || !t[Condition])
			)
			{
				this[RunTransition](t[From], t[To]);
				break;
			}
		}

		return this;
	}

	private startingState?: PropertyKey;

	private currentState!: State | FiniteStateMachine;

	private nextState?: State | FiniteStateMachine;

	private initialized = false;

	private transitionPending = false;

	private states = new ReverseMap<PropertyKey, State | FiniteStateMachine>();

	private transitions = new Set<Transition>();

	private globalTransitions = new Set<Transition>();

	private eventTransitions = new ReverseMap<PropertyKey, Set<Transition>>;

	private globalEventTransitions = new ReverseMap<PropertyKey, Set<Transition>>();

	private readonly [ProvidedUpdate]?: (delta: number, elapsed: number) => void;

	/** @internal */
	[Actions]: Map<PropertyKey, Function> = new Map;

	/** @internal */
	[onEnter]?: () => void;

	/** @internal */
	[onExit]?: () => void | Promise<void>;

	/** @internal */
	[onCanExit]?: () => boolean;

	/** @internal */
	[ExitCurrentState](): void | Promise<void>
	{
		if(this.currentState instanceof FiniteStateMachine) this.currentState[ExitCurrentState]();
		return this.currentState[onExit]?.();
	}

	private [RunTransition](from: PropertyKey | undefined, to: PropertyKey)
	{
		const toState = this.states.get(to);

		if(!toState)
		{
			ELYSIA_LOGGER.error("Invalid state transition.");
			return;
		}

		this.nextState = toState;

		if(this.transitionPending) return;

		this.transitionPending = true;

		const maybePromise = this[ExitCurrentState]()

		const onComplete = () => {
			this.currentState = this.nextState!;
			this.nextState = undefined;
			this.transitionPending = false;
			if(this.currentState instanceof FiniteStateMachine) this.currentState.init();
			else this.currentState[onEnter]?.();
		}

		if(maybePromise instanceof Promise) maybePromise.then(onComplete)
		else onComplete();
	}

	/** @internal */
	[onUpdate](delta: number, elapsed: number)
	{
		if(!this.initialized) return;

		const transition = this[GetMatchingTransition]();

		if(transition) this[RunTransition](transition[From], transition[To]);

		this[ProvidedUpdate]?.(delta, elapsed);
		this.currentState[onUpdate]?.(delta, elapsed);
	}

	/** @internal */
	[GetMatchingTransition](): Transition | undefined
	{
		for(const transition of this.globalTransitions)
			if(transition[To] !== this.states.getKey(this.currentState) && isFunction(transition[Condition]) && transition[Condition]()) return transition;

		for(const transition of this.transitions)
		{
			if(
				transition[From] &&
				// if there is a next state, it means we are currently transitioning
				// so we use that state for the from comparison
				this.states.getKey(this.nextState ?? this.currentState) === transition[From] &&
				(typeof transition[Condition] === "function" && transition[Condition]())
				|| typeof transition[Condition] === undefined
			) return transition;
		}
	}
}

// todo:
// add support for array syntax for from/to fields in transitions and events
// add ghost states for states that immediately transition to another state
