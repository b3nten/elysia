// @ts-nocheck

export function CatchAndReport(value: any, { kind, name })
{
	if (kind === "method")
	{
		return function (...args)
		{
			let ret;
			try
			{
				ret = value.call(this, ...args);
			}
			catch (err)
			{
				const errorMessage =
					err instanceof Error ? err.message : String(err);
				console.error(
					`Error in ${name} method of ${this.name}: ${errorMessage}`,
				);
			}
			return ret;
		};
	}
}
