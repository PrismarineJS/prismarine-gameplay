<h1 align="center">Prismarine-Gameplay Implementation Notes</h1>

<p align="justify">The purpose of this document is to describe the detailed plans for the implementation of the <em>prismarine-gameplay</em> plugin. As there have been many different disscussions concerning how many various approachs could be made, this document provides a singular location to finalize these plans during the initial implementation process. Note that this document may change, or be removed completely at any time during the development of the plugin.</p>

---

## Table of Contents <!-- omit in toc -->

- [1. Goals](#1-goals)
- [2. Infinite State Machine Approach](#2-infinite-state-machine-approach)
  - [2.1. Hierarchy](#21-hierarchy)
  - [2.2. Plugins](#22-plugins)
  - [2.3. Global Parameters](#23-global-parameters)
  - [2.4. Highly Reusable Strategies](#24-highly-reusable-strategies)
  - [2.5. Limitations](#25-limitations)
  - [2.5.1. Hard Dependencies](#251-hard-dependencies)
  - [2.5.2. Interrupting Tasks](#252-interrupting-tasks)
- [3. Additional Thoughts](#3-additional-thoughts)
  - [3.1 July 28th](#31-july-28th)

---

## 1. Goals

Here, the term "task" and "strategy" are used interchangeably.

The main objective of _prismarine-gameplay_ is to add a higher level API to a Mineflayer bot to remove a lot of the low-level work required to complete a task. Writing bots should be easy. There's no reason for developers to need to rewrite common tasks over and over into each bot they, or any one else, makes.

Through the usage of prismarine-gameplay, most commonly tasks can be run using a single API call without needing to specify each operation the bot would need to preform in order to complete that task. Knowledge of core gameplay elements from Minecraft should be given to the bot to allow it to decide for itself how to complete tasks. A common example of this would be asking the bot to mine diamonds. The bot should have a general understanding of where to find diamonds, how to harvest them, how to create tools in order to mine them, and how to collect resources to make those tools.

Each task should also be environmentally aware and take these aspects into consideration when attempting to preform various tasks. For example, if the bot was in the Nether, and was asked to collect diamonds, it would need to know that it needs to first travel back to the Overworld in order to begin searching for diamonds. However, if diamond blocks were manually placed around the bot while still in the Nether, it should know to try and collect these blocks first, if possible.

Lastly, it should be easy for players to define their own strategies to give to the bot in order to complete tasks in a special way that the bot might not have initially considered. For example, if the bot was asked to collect iron, it would travel into the mines to begin looking for ore. However, if a developer created a custom strategy which explained how to build and use an iron farm, the bot would take that into consideration when collecting iron.

## 2. Infinite State Machine Approach

The initial idea for approaching this goal is through the use of an infinite state machine. This approach would allow for a strategies to act as states within a state machine tree that, in tern, call other strategies as needed. By making tasks dynamically create and run other tasks while executing, the bot is able to quickly adapt to it's current situation and handle it accordingly. This situation offers a very easy approach to write new strategies for the bot to preform and allows these strategies to make use of the higher level API they are helping to create. In addition, tasks can be executed immediately on the bot without needing to preform any search algorithms or do any decision making.

### 2.1. Hierarchy

This approach relies on the ability for strategies to conditionally call other strategies based on the current needs of the bot. These needs are determined during execution and can be adapted to instantly. This also allows the bot to operate in a human-like manner, where execution information is hidden from the bot until it is ready to preform that step. This can be seen as the bot knowing it will receive ores for mining, but not knowing when or where it'll run into them.

![Dependencies](./images/Dependencies.svg)

In the image above, you can see an example of a dependency map. Each strategy/task is a node within this map. When called, it in turn may call any of it's children any number of times while executing until the task is complete. Because some strategies depend on parent strategies, (as shown by "Get Recipe Resources" depending on "Find Resource"), each node can recursively generate new tasks as needed in order to complete the given task. When a child task is finished executing, the parent task continues. Likewise, any node on this graph can be considering an entry point for the bot to preform. Each task can be executed manually by the developer using only a single API call.

The image above is just an example of what the dependency map would look like. In reality, there can be any number of strategies added to the bot and the tree would likely be significantly bigger.

It can be also seen as the dependency map being used to generate a procedural state machine based on the given requirements of the task and environment the bot is in.

![Find Resource Tree](./images/Find%20Resource%20Tree.svg)

For example, if we were to run the "Find Resource" strategy on the above graph, it could produce this result. This state machine is useful in allowing the bot to preform actions, dynamically adjusting to it's environment, until the given task is complete. This procedurally generated graph can be any size or complexity, expanding on itself as needed during execution.

### 2.2. Plugins

Another important factor in this approach is the ability for developers to define their own custom strategies on top of these strategies in order to create custom, more complex behavior styles and execute tasks more effectively. Plugins can be defined by simply extending a single abstract class and overriding the `run(options, cb)` function in order to define behavior styles. From inside this function, strategies can create and execute new strategy instances with custom parameters.

These plugins can be loaded into the bot by calling `bot.gameplay.addStrategy(myStrategy)`. A function call is automatically generated on the bot.gameplay object as well as proper error handling and callback wrappers for executing it safely. Generated function call is: `bot.gameplay.myStrategyName(options, cb)`

Through the use of plugins, it also becomes extremely easy to define behaviors which are specific to a specific server or custom mini game. Some servers offer virtual shops which can be used to obtain resources without needing to collect them manually. Creating a strategy which allows the bot to understand how to use the in-game shop would be useful here as it might just be significantly easier to buy a given resource rather than try and hunt down that resource manually.

### 2.3. Global Parameters

Because new strategy instances are created as the solver dives deeper and deeper into the search tree, it can be extremely useful to provide a set of global parameters to follow that all strategy instances can read from regardless of depth. This would be helpful to specify what kind of conditions are expected. This could contain information such as whether or not the bot is capable of XRay, should ignore hunger, priority levels of ores, whether or not to place torches, etc.

It would be up to strategies individually to choose what properties to read and what properties to ignore.

### 2.4. Highly Reusable Strategies

By makes strategies more configurable they become significantly more reusable. You wouldn't need as many different strategies in order to produce more complex behaviors. This would also mean less code to maintain overall and less code to update if more strategies are added to the game which rely on old strategies being tweaked.

### 2.5. Limitations

There are currently two major limitations exist with this dynamic state approach. Below are the limitations and proposed solutions to overcoming these limitations.

### 2.5.1. Hard Dependencies

The first major problem lies with the implementation of hard dependencies in the state machine. A strategy/plugin will always execute the same children. In closed environments, this is never an issue. However, when loading new strategies, these new strategies are never considered by the original, pre-defined strategy functions. While new strategies can always call existing strategies, existing strategies can never call new strategies.

<h4><ins><em>Solutions</em></ins></h4>

**Heuristic Based Task Selection**

The first proposed solution to this problem is to allow for existing strategies to select strategies from a list to execute. Heuristics could be used in order to determine what task would be best suited for the job at the given time. However, this raises some major questions:

1. How would we know the subtask we are executing actually solves the intended problem?

   - With hard dependencies, it becomes easy to know exactly what function would be executed for the given situation. "Collect Recipe Resources" will always call "Find Resources", meaning it's known that by the end of the task, the required resources will always be obtained if possible. Using a heuristic based implementation, the selected task may not be the type of task needed for this situation. This could lead to many problems with getting stuck or executing tasks that make no sense for the given situation.

2. How would we properly guess the heuristics for the given task?

   - Using a heuristic based approach heavily relies on heuristics to be stable enough that certain strategies are not given an unfair bias, or that heuristics are correctly estimated between two similar strategies. If one strategy determines a cost of 10 while another strategy determines a cost of 100 for the same operation, one task will _always_ be given priority over the other due to the deferences in scaling. In addition, what exactly would we be measuring? The estimated time to execute? How many actions need to be preformed? How likely a human is to preform this task in this situation? In addition, what if the heuristics are vastly different from what they should be, simply because not enough information was taken into consideration.

3. How long would it take to guess the correct task to use?

   - If it takes to long to determine the heuristics for a situation, this could vastly effect the performance of the bot, leading to noticeable stalls and poor reaction times. For extremely bad estimation times, the bot may stand idle for many seconds or even entire minutes by attempting to process too much information. Even if the heuristic estimation is simple, it could still be slowed down drastically by the number of loaded strategies being considered if many plugins are installed. Caching would be important, but would have to be handled differently for each situation. This might be tricky to implement.

4. How far ahead should we look?

   - When determining tasks to preform, it may require a much deeper search to preform in order to correctly select a task. It may look like a given task may be extremely optimal or suboptimal at first, but by searching two or three layers deep, it would become clear that the initial estimate could be completely wrong by a large margin.

5. Who is determining these heuristics?

   - When is comes to calculating the actual heuristic, who would be preforming these calculations? The base plugin? The parent strategy? The child strategy? If defined in either one, how would the correct heuristic be calculated without completely understanding the implementation of the other?

**Injection Based Task Selection**

Injection based task selection is a modification of the above heuristic-based solution which attempts to stay largely rooted in using hardcoded dependencies where practical. In this solution, each strategy can contain lists of available strategies that other strategies can use to inject themselves into. This allows for some decision making to still occur but also allows for both the parent and child tasks to understand each other's role a bit better, meaning more realistic estimations can be made for the heuristics. This still caries some of the problems over from the heuristic based solution, but makes the transition smoother by fixing issues regarding improper task selection or blind heuristic estimations. The issues for how far to look ahead and how long it would take to calculate the heuristics still exist.

While this solution fixes most of the issues from the heuristic based solution, it also proposes a new problem in which two separate plugins would not be able to see each other, meaning a bridge plugin would need to be made in those situations in order for either plugin to consider using the other plugin's strategies directly. On the flip side, both plugins could still be expecting by the default strategies without needing to know about the existence of the other, meaning that indirect communication does still exist by default.

### 2.5.2. Interrupting Tasks

There are several situations that may occur while executing tasks which require the bot to stop executing it's current task temporarily. Some common examples of these situations are being attacked by a random mob, receiving heavy damage, unexpected potion effects, or being hungry.

With the current state machine implementation, it's not directly obvious where these types of events should be handled without checking for them in every single task. This is obviously slow to execute and cumbersome for the developer making the tasks.

<h4><ins><em>Solutions</em></ins></h4>

**Pauseable/Cancelable Tasks**

By allowing tasks to be "paused" or "canceled", depending on the task, noteworthy events can send event triggers which cause the currently executing task to stop executing and generate a new temporary subtask instantly for handling the given situation. This would be implemented by the gameplay plugin itself rather than the strategy, thus all strategies would be able to preform this task at given breakpoints. After the subtask has finished executing, the original task is either resumed or restarted depending on which action it supports. If a task does not support either of these options, the bot would wait until the task is completed before handling the situation. Execution control would return to the parent task afterwards.

The implementation of this feature changes certain aspects of the design which would need to be considered while developing new strategies.

1. Child tasks many take any amount of time to finish if it is interrupted.
2. The bot may be in a completely new state after being interrupted. Changes must be checked for and handled accordingly.

In some situations, it might be simply easier for the bot to cancel the entire task tree and execute the original task again. Given that the bot may have been anywhere in the task when it's canceled, it would be imperative for the bot to regain an understanding of it's new world state and adapt accordingly to the new situation. (I.e. if already in a mineshaft, don't build a new one.) However, doing this would determined solely by the original strategy.

When executing tasks, it would also be important to send a message to all parent tasks recursively that an interruption had occurred while executing the child task so that proper state checking must be done to correct any inconsistencies.

## 3. Additional Thoughts

### 3.1 July 28th

**Global Dependency Lists**

After some more thought on the matter, some slight adjustments that could be made to increase flexibility and problem solving performance could be to create global dependency lists. By this, instead of each strategy individually having their own list of possible actions to preform, as suggested in **Heuristic Based Task Selection**, a set of global lists are used which specify sets of actions that strategies can add themselves to and any strategy can reference for execution. An example of this could be for a "createResource" dependency list. Then, all strategies which create a resource can add themselves to this list. Strategies which require a specific resource to be may can check this list and test all items in this list for the set of conditions (I.e. Can Create Obsidian) any strategies in the list that report they cannot preform that action are skipped. Remaining strategies are sorted by heuristic and the best option is executed.

By using this approach, we no longer have to worry about cross-plugin compatibility, or making multiple copies of the same dependency list. It also makes it easy for a single strategy to report that they can fulfill multiple dependencies if needed.

**Orderless Dependencies**

In some situations, such as collecting all of the resources needed for a recipe, the order in which these dependencies are executed doesn't really matter. In this situation, it could be useful to make use of orderless dependencies. In this case, after all dependencies are selected for execution, these are sorted based on heuristic rather than executing in order. This would allow easy dependencies to be executed first, leading to a more natural-looking behavior when playing.

Additional tweaks can be made as well. For example, if a single task was exceptionally difficult compared to the rest, the task might be executed first to get it out of the way. Usually when trying to make a diamond pickaxe, players don't first collect the wood to make sticks until after they already have the diamonds. This is all configurable by the user.

**Optional Dependencies**

Optional dependencies do not need to be executed in order for the strategy to run, however, if these dependencies are met, they may help the heuristics of the strategy in some situations. For example, if a lot of wood needs to be collected in the future, building a tree farm might initially slow things down, but ultimately increase performance in the long term. Building a beacon might be costly, but it might drastically help reduce the time it tasks to mine if collecting very large amounts of blocks.

Optional dependencies may also include taking shortcuts if a given condition is met. Such as building a diamond pick to replace an iron one, but only if diamond is currently owned and spendable. Checking for this is as easy as checking through the dependency list and seeing what actions are available and which ones can be run. If no actions are available or all available strategies would increase the heuristic too much, these can be skipped. Heuristic would be calculated twice, once without the dependency and once with it. The smaller of the two values is selected.

**Task Failure**

When tasks fail, the path needs to be course-corrected. A task can fail when either a task fails to be executed for any reason (such as a pickaxe breaking or being attacked by a mob.) the task would alert its parent task that it failed. If that task was a dependency of of the parent task, the parent task would attempt to preform that next available task in that dependency list. If all available dependencies fail, the parent task would fail to meet any dependencies, and therefore would mark itself as failed, altering it's parent, continuing up the chain as needed.

This allows the bot to course correct constantly once it runs into unexpected situations or dead ends in the solver.

**Task Tree**

Due to the shape in which the solver generates a path for the bot to preform, the map of actions to preform can be rendered as a tree. This tree is generated as the bot executes tasks in order to adapt to the world around it. This works by recursively subdividing tasks based on known information. This tree is executed from top to bottom, where a task in only considered finished once all child tasks are finished.

Some items may be only conditionally executed, such as searching for the natural location of a block type if none are nearby. Another example could be executing task in a loop for mining all nearby blocks of a type.

```
Collect Resource [7 Diamonds]
   Get Sources [Diamond]
      Get Blocks That Drop [Diamond]
      Get Smelts That Drop [Diamond]
      Get Recipes That Drop [Diamond]
      Get Mobs That Drop [Diamond]
   Find Blocks Nearby [Diamond Ore, Diamond Block]
   * Get Natural Location [Diamond Ore]
   * Get Natural Location [Diamond Block]
   ...
```

When looking ahead in the tree, only direct child tasks of the given task can be observed. So the tree will constantly add more nodes as it continues executing. In addition, mode nodes can be added if depending on how child tasks are executed. Finding blocks to mine would often add tasks to mine those blocks directly, while returning an empty array will often trigger tasks for finding the natural location of the block type to look for it. In addition, new tasks can be added if the given task fails and the bot needs to reroute.

**Planning Ahead Using Probability**

In some situations, in can be useful to try an estimate actions which would come next. This would be extremely useful for things such as estimating how many pickaxes to bring into a mine based on the probability of finding diamonds while mining. The AI could also collect resources it doesn't need, while they're readily available, in order to avoid having come back to collect them later when they are needed.

This could be done easily by having strategies run by assuming the most likely state of the world at each position in the tree, the AI would be able to estimate the path that will be taken ahead of time up to a certain depth away from the bot. In situations where the actual result doesn't match the estimated result, the estimated tree would be recalculated and updated accordingly. In times where tasks are using very little CPU to preform a task, addition trees could be calculated by using the second or third mostly likely events to occur at each step on the path. This would avoid needing to recalculate the entire tree when a slightly less likely path-break occurs.

Through the use of this approach, the entire heuristic cost of the tree can be estimated, meaning that decisions can be made above more easily by knowing how it'll most likely effect the heuristic cost of the tree in the long term. More optimal routing paths can be generated using this approach.
