/**
 * The story crawl: everything you may want to edit lives in this file. The animation code never needs to change.
 *
 * Writing rules
 *  - `paragraphs` are plain strings. One string = one paragraph. A blank-free, short paragraph reads best in the crawl.
 *  - Chapter numerals (I, II, III …) are added for you, in order, for the chapters that are shown.
 *  - A chapter with `draft: true` is NOT shown. It is a prompt for something only you can tell: write the paragraphs,
 *    then delete the `draft` line (or set `showDrafts` below to true to preview them while you write).
 *
 * The text is Sudeep's own, in his own words. `intro` comes before Chapter I and `outro` after the last chapter.
 */

export type Chapter = {
  id: string;
  title: string;
  paragraphs: string[];
  /** Hidden until you write it. `prompt` says what is missing. */
  draft?: boolean;
  prompt?: string;
};

export const story = {
  /** The title card shown before the crawl begins. */
  title: "A Brief History of Me Breaking Things",
  subtitle: "(And Occasionally Fixing Them)",
  kicker: "An origin story in several questionable decisions.",
  byline: 'Sudeep Sigdel',

  /** The opening, before Chapter I. Unnumbered. */
  intro: [
    "My name is Sudeep Sigdel. I grew up in Kawasoti, Nepal, surrounded by technology, or at least whatever passed for it in our household at the time.",
    "Long before I knew what a backend was, what an API did, or why people on the internet kept arguing about programming languages, I was fascinated by computers. I didn't really understand how any of it worked. I just knew that these machines could do some pretty cool things, and I wanted to be the person who figured out how.",
    "As it turns out, that curiosity would eventually become a career interest, a hobby, and a remarkably effective way to lose track of time.",
    "But first, there were games to play.",
  ],

  /** The last lines of the crawl, after the final chapter. */
  outro: [
    { text: "I'm Sudeep Sigdel. I build things, break things, learn from both, and try to make the next version a little better.", emphasis: "strong" },
    { text: "Thanks for making it this far. You have officially spent more time reading about my life than some of my computers spent running without crashing.", emphasis: "em" },
  ] as { text: string; emphasis: 'strong' | 'em' }[],

  /** The line that ends the crawl, and the two ways out of it. */
  closing: {
    line: 'That is the story so far.',
    workLabel: 'Selected work',
    returnLabel: 'Return to the meadow',
  },

  /** Set to true to preview the `draft` chapters (their prompts are shown in place of text). */
  showDrafts: false,

  timing: {
    /**
     * How fast the crawl reads, in words per minute. The scroll speed is worked out from this and the real length of the
     * text, so a longer story automatically takes longer. 200+ is a normal reading pace; 100 to 130 is a slow, cinematic one.
     */
    wordsPerMinute: 230,
    /** Empty seconds before the first line rises. */
    introSeconds: 1.5,
    /** The deliberate pause (empty crawl) between chapters. */
    chapterPauseSeconds: 3,
    /** Empty seconds after the last line, before the closing card. */
    outroSeconds: 2,
  },

  /**
   * The soundtrack. Leave `src` empty and the whole experience runs in silence (the sound button is shown disabled).
   * To add music, put a file you have the right to use in `public/audio/` and point `src` at it, e.g. '/audio/story.mp3'.
   * Do not use a commercial film score. Royalty-free or properly licensed orchestral/ambient music works well.
   * It never plays on its own: sound starts only after the visitor presses the sound button, and is remembered for the session.
   */
  audio: {
    src: '',
    volume: 0.55,
    fadeInSeconds: 2.5,
    fadeOutSeconds: 1.4,
    /** Optional credit, shown on the closing card, e.g. 'Music: “Title” by Artist (licence)'. */
    credit: '',
  },

  chapters: [
    {
      id: "windows-xp-and-the-art-of-doing-absolute",
      title: "Windows XP and the Art of Doing Absolutely Nothing Productive",
      paragraphs: [
        "When I was around six or seven, we got a computer at home running Windows XP.",
        "No internet. No online tutorials. No Stack Overflow. No AI coding assistant patiently explaining why my code didn't work.",
        "Just a computer, a CRT monitor, and whatever we could get our hands on.",
        "The computer was primarily used for movies and games. We would search the local market for game CDs, bring them home with the excitement of someone installing cutting-edge software, and discover that half the games refused to run because our computer apparently hadn't received the memo about graphics cards.",
        "We played Plants vs. Zombies a lot.",
        "Honestly, it was a solid use of the hardware.",
        "We also had a habit of formatting the computer and reinstalling Windows. Sometimes Windows 7 would make an appearance, only to be replaced by Windows XP again because the hardware clearly preferred retirement over innovation.",
        "I don't remember exactly why we kept doing this. Perhaps we thought reinstalling Windows was a universal solution to every computer problem. Perhaps we just liked watching progress bars.",
        "Either way, we were learning something. Not necessarily the right things, and certainly not in the most efficient way, but learning nonetheless.",
        "One of my favourite memories is carrying our CRT monitor on the back of a bicycle from our room to our grandmother's house so we could play games there.",
        "A portable gaming setup, if you ignore the fact that the monitor weighed approximately as much as a small planet.",
        "We didn't have Steam libraries, cloud saves, or gaming laptops. We had game CDs, questionable system requirements, and the determination to make things work.",
        "Looking back, it was a pretty good introduction to technology: curiosity first, technical understanding later.",
        "Preferably before the next Windows reinstall.",
      ],
    },
    {
      id: "five-rupees-a-megabyte-and-other-financi",
      title: "Five Rupees a Megabyte and Other Financial Mistakes",
      paragraphs: [
        "Before we got our own laptop, phones were a big part of our lives.",
        "Especially my dad's phone.",
        "We played Clash of Clans on it constantly. There was just one small problem: mobile data cost money, and we were not particularly interested in acknowledging that fact.",
        "We would play without purchasing a proper data package, using whatever mobile data was available at rates that I remember being around five rupees per megabyte.",
        "Five rupees. Per. Megabyte.",
        "For context, we were children who thought the best use of a phone was to attack cartoon villages and collect imaginary resources.",
        "My dad, understandably, was not impressed when the bills arrived.",
        "We, meanwhile, were busy planning our next attack.",
        "In hindsight, this was probably my first exposure to resource management. We just happened to be managing someone else's resources very badly.",
        "Eventually, we got our own laptop. Naturally, this opened up a whole new world of movies and games.",
        "But something else happened, too.",
        "We started getting curious about what was happening behind the screen.",
      ],
    },
    {
      id: "batch-files-load-shedding-trackers-and-p",
      title: "Batch Files, Load-Shedding Trackers, and Premature Engineering",
      paragraphs: [
        "Our laptop was still mostly an entertainment machine, but we began experimenting with programming.",
        "Our knowledge was extremely limited. Basic conditions, loops, and whatever we could figure out through trial and error.",
        "We discovered batch scripting and started making little projects.",
        "One of them was a load-shedding tracker.",
        "For those unfamiliar with Nepal's not-so-distant relationship with scheduled power cuts, load-shedding was a pretty familiar part of everyday life. We decided to build a program to track it.",
        "Was it sophisticated? Absolutely not.",
        "Was it going to disrupt the software industry? Probably not.",
        "Did it feel amazing to make a computer do something we had instructed it to do? Absolutely.",
        "We also explored Linux and tried game development with Unity. Unfortunately, the combination of limited knowledge, limited resources, and no internet meant that learning often involved reaching a dead end and having absolutely no idea where to go next.",
        "There was no YouTube tutorial waiting to rescue us. No conveniently generated explanation. No developer forum open in another tab.",
        "If something didn't work, we either figured it out ourselves or moved on to something else.",
        "We did a fair amount of the latter.",
        "Still, these little experiments planted a seed. I had already decided that I wanted to study computers when I grew up. I just hadn't yet discovered how much there was to learn, or how many different ways a computer could refuse to cooperate.",
        "That discovery would come later.",
        "Repeatedly.",
      ],
    },
    {
      id: "the-gaming-pc-that-never-quite-happened",
      title: "The Gaming PC That Never Quite Happened",
      paragraphs: [
        "In grade nine, I moved to Kathmandu.",
        "For the first time, I had access to the internet in a way that made exploring technology much easier. Suddenly, there were endless videos about computer hardware, operating systems, software, and all the things I had previously been curious about without knowing where to look.",
        "I consumed a ridiculous amount of content about computers.",
        "I wanted to build my own gaming PC so badly. I watched builds, compared components, learned about hardware, and mentally assembled computers that my actual budget had no intention of funding.",
        "Then the pandemic happened.",
        "The gaming PC remained a beautiful concept.",
        "But I did have a computer, and I started opening it up, cleaning it, and trying to understand what was inside.",
        "Sometimes it worked perfectly after I put it back together. Sometimes it didn't.",
        "I wish I could say I had a rigorous diagnostic process, a multimeter, and an elegant understanding of hardware failure.",
        "Mostly, I had curiosity, a screwdriver, and the willingness to try again.",
        "Somehow, I got good enough at troubleshooting to fix things myself.",
        "At some point, I realised that I enjoyed the process almost as much as the result. There was something satisfying about taking a machine that refused to work, understanding what might be wrong, and getting it running again.",
        "Of course, there was also the possibility of turning one problem into three new ones.",
        "That was part of the experience.",
      ],
    },
    {
      id: "when-electricity-becomes-your-qa-enginee",
      title: "When Electricity Becomes Your QA Engineer",
      paragraphs: [
        "We eventually moved back to Kawasoti.",
        "Unfortunately, the electricity had other plans for my computing journey.",
        "Voltage fluctuations and power issues meant that my computer would crash or restart unexpectedly. Files became corrupted, software broke, and the machine developed a talent for failing at the least convenient moment.",
        "This was particularly unfortunate because I played Valorant.",
        "Imagine spending a match trying to rank up, only for your PC to restart in the middle of a game because the electricity has decided that your plans are not important.",
        "Imagine it happening repeatedly.",
        "Now imagine getting banned for one hundred years.",
        "Yes. One hundred years.",
        "I would like to say that this was the moment I learned the importance of a UPS, reliable power delivery, and proper electrical protection.",
        "Instead, I mostly learned that competitive gaming and unstable electricity are not a healthy combination.",
        "But the constant failures pushed me further into troubleshooting. I started watching Indian YouTubers who taught people how to repair computers, diagnose software issues, and fix Windows installations.",
        "I learned by watching, trying, failing, and trying again.",
        "We opened multiple old laptops and desktop computers, some of which were no longer usable because of hardware problems. We salvaged whatever components still worked and combined resources to keep at least one computer running.",
        "It was the closest thing we had to a hardware recycling programme.",
        "A little RAM from here. A working component from there. A machine that probably should have been retired, somehow brought back to life.",
        "It wasn't elegant, but it worked.",
        "And somewhere along the way, troubleshooting stopped being just something I did when a computer broke. It became something I genuinely enjoyed.",
        "There is a certain satisfaction in understanding a problem well enough to fix it.",
        "There is also a certain satisfaction in discovering that the problem was something ridiculously simple all along.",
        "Both are important lessons in engineering.",
      ],
    },
    {
      id: "the-buzzword-era",
      title: "The Buzzword Era",
      paragraphs: [
        "Then came my bachelor's degree in Computer Science and Information Technology.",
        "I had always known I wanted to study computers, so this felt like the natural next step.",
        "Except university introduced a new problem.",
        "Buzzwords.",
        "Everywhere.",
        "People talked about technologies, architectures, protocols, frameworks, and concepts that seemed incredibly important. I would hear a term, look it up, read about it, and feel like I understood it.",
        "Then I would hear it again a few weeks later and realise that my brain had apparently treated the entire subject as temporary cache.",
        "So I kept searching.",
        "One term led to another, which led to another, which led to an entirely unrelated topic at two in the morning.",
        "I explored different areas of technology, gradually piecing together how the different parts fit together. The more I learned, the more I realised that knowing the name of a technology and understanding the problem it solves are two very different things.",
        "Unfortunately, I was still collecting names at an impressive rate.",
        "Then came my first hackathon.",
        "And, unexpectedly, things started making sense.",
      ],
    },
    {
      id: "fastapi-and-the-moment-things-finally-cl",
      title: "FastAPI and the Moment Things Finally Clicked",
      paragraphs: [
        "For my first hackathon, I learned FastAPI.",
        "That experience changed how I understood software development.",
        "Until then, web development had felt like a collection of separate concepts, tools, and mysterious things that somehow communicated with one another.",
        "Learning FastAPI helped me connect the dots.",
        "I started understanding how the web actually works, how clients and servers communicate, how data moves between them, and, most importantly, what an API really is.",
        "It was one of those moments when a bunch of things you have heard about for months suddenly begin to fit together.",
        "I wasn't just memorising technologies anymore. I was beginning to understand the systems behind them.",
        "Naturally, this was also the point at which I discovered approximately seventeen new rabbit holes.",
        "Backend development led me to databases, authentication, API security, system design, performance, and all the other things that make a seemingly simple application considerably less simple once real users start interacting with it.",
        "I found myself increasingly drawn to the backend side of things: the logic, the data, the communication between systems, and the engineering decisions that make software reliable.",
        "I like understanding what happens behind the scenes. I like breaking complicated problems into smaller ones and figuring out how the pieces should fit together.",
        "And I like that there is always something else to learn.",
        "Although, at this point, I would appreciate it if the industry stopped inventing new buzzwords for five minutes.",
        "I have notes to organise.",
      ],
    },
    {
      id: "from-learning-to-teaching",
      title: "From Learning to Teaching",
      paragraphs: [
        "At some point, I realised that I didn't just want to learn these things. I wanted to help other people understand them, too.",
        "So I did.",
        "I co-organised a workshop with a friend where he taught Python and I taught FastAPI.",
        "It was a fun experience. Teaching forced me to think more carefully about concepts I had previously taken for granted. Something that feels obvious when you're using it every day can become surprisingly difficult to explain to someone encountering it for the first time.",
        "It also taught me that understanding something well enough to use it and understanding it well enough to teach it are two very different milestones.",
        "There is no better way to discover the gaps in your own understanding than to have someone ask a perfectly reasonable question you have somehow never considered.",
        "I enjoyed helping people get started, watching concepts click into place, and sharing the excitement that originally got me interested in technology.",
        "It felt a little like returning to those early days of experimenting with computers, except that this time I could explain at least some of what was happening.",
        "Progress.",
        "I have also participated in multiple hackathons. I haven't won any yet, but I've learned from the experience, built things with other people, and gotten more comfortable turning ideas into working software under constraints.",
        "The trophies are still pending.",
        "The experience, thankfully, is not.",
      ],
    },
    {
      id: "so-what-do-i-actually-do-now",
      title: "So, What Do I Actually Do Now?",
      paragraphs: [
        "Today, I'm a final-year BSc CSIT student with a strong interest in backend engineering.",
        "I work primarily with Python and tools such as FastAPI, REST APIs, PostgreSQL, and SQLAlchemy. I'm interested in how applications are designed, how their components communicate, how data is managed, and what happens when things inevitably go wrong.",
        "I enjoy the engineering behind software: the decisions that aren't always visible in the interface but determine whether the application is reliable, maintainable, and capable of doing what it promises.",
        "I'm particularly interested in building practical systems, understanding their trade-offs, and improving the way they work.",
        "I'm also still exploring.",
        "Some days that means working on a project. Other days it means diving into an unfamiliar concept, reading documentation, experimenting with an idea, or discovering that the solution to a problem is much simpler than the architecture I spent three hours designing for it.",
        "I'm learning to build things before worrying too much about making them perfect.",
        "This is an ongoing process.",
        "Apparently, even after years of experience with computers, it is still possible to overthink a project before writing the first line of code.",
        "Who knew?",
      ],
    },
    {
      id: "still-figuring-things-out",
      title: "Still Figuring Things Out",
      paragraphs: [
        "When I look back, the journey makes a little more sense than it did while I was living it.",
        "A childhood spent playing games on Windows XP turned into experimenting with batch scripts. That became an interest in hardware, troubleshooting, and operating systems. Access to the internet opened up new possibilities, university introduced me to deeper concepts, and FastAPI helped connect a lot of the pieces.",
        "None of it followed a particularly organised roadmap.",
        "There was no five-year plan when I was carrying a CRT monitor on a bicycle. There was no carefully designed curriculum when I was reinstalling Windows for reasons I can no longer defend. And there was certainly no grand strategy behind trying to keep an old computer alive while the electricity kept trying to shut it down.",
        "I was simply curious.",
        "I wanted to know how things worked, why they broke, and whether I could make them work again.",
        "That curiosity is still what drives me.",
        "I'm not going to pretend I know everything. Technology moves too quickly for that, and I have enough experience with computers to know that confidence and correctness are not always closely related.",
        "What I can say is that I enjoy learning, I like solving problems, and I'm willing to get my hands dirty figuring things out.",
        "I'm still building things. Still exploring rabbit holes. Still learning how to make better engineering decisions.",
        "And, occasionally, still wondering whether I should just reinstall Windows.",
      ],
    },
  ] as Chapter[],
};

/** The chapters that will be shown, with their numerals. */
export function visibleChapters() {
  const shown = story.chapters.filter((c) => story.showDrafts || !c.draft);
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
  return shown.map((c, i) => ({
    ...c,
    numeral: roman[i] ?? String(i + 1),
    paragraphs: c.draft ? [`[Draft] ${c.prompt ?? ''}`] : c.paragraphs,
  }));
}

export function storyWordCount() {
  const words = (xs: string[]) => xs.join(' ').split(/\s+/).filter(Boolean).length;
  return visibleChapters().reduce((n, c) => n + words(c.paragraphs), 0) + words(story.intro) + words(story.outro.map((o) => o.text));
}
