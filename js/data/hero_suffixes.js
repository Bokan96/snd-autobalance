// Hero suffix mappings for Slice and Dice Pick Rate Analyzer
// Each hero has unique suffixes for top picks and low picks
const HERO_SUFFIXES = {
    // Tier 1 Fighters
    "Berserker": { topPick: "berserker.n.BerserkerTop", lowPick: "berserker.n.BerserkerLow" },
    "Brute": { topPick: "brute.n.BruteTop", lowPick: "brute.n.BruteLow" },
    "Collector": { topPick: "collector.n.CollectorTop", lowPick: "collector.n.CollectorLow" },
    "Gladiator": { topPick: "gladiator.n.GladiatorTop", lowPick: "gladiator.n.GladiatorLow" },
    "Soldier": { topPick: "soldier.n.SoldierTop", lowPick: "soldier.n.SoldierLow" },
    "Whirl": { topPick: "whirl.n.WhirlTop", lowPick: "whirl.n.WhirlLow" },
    "Scrapper": { topPick: "scrapper.n.ScrapperTop", lowPick: "scrapper.n.ScrapperLow" },
    "Sinew": { topPick: "sinew.n.SinewTop", lowPick: "sinew.n.SinewLow" },
    
    // Tier 2 Fighters
    "Barbarian": { topPick: "barbarian.n.BarbarianTop", lowPick: "barbarian.n.BarbarianLow" },
    "Brawler": { topPick: "brawler.n.BrawlerTop", lowPick: "brawler.n.BrawlerLow" },
    "Curator": { topPick: "curator.n.CuratorTop", lowPick: "curator.n.CuratorLow" },
    "Leader": { topPick: "leader.n.LeaderTop", lowPick: "leader.n.LeaderLow" },
    "Veteran": { topPick: "veteran.n.VeteranTop", lowPick: "veteran.n.VeteranLow" },
    "Bash": { topPick: "bash.n.BashTop", lowPick: "bash.n.BashLow" },
    "Eccentric": { topPick: "eccentric.n.EccentricTop", lowPick: "eccentric.n.EccentricLow" },
    "Captain": { topPick: "captain.n.CaptainTop", lowPick: "captain.n.CaptainLow" },
    "Wanderer": { topPick: "wanderer.n.WandererTop", lowPick: "wanderer.n.WandererLow" },
    
    // Tier 1 Rogues
    "Dabbler": { topPick: "dabbler.n.DabblerTop", lowPick: "dabbler.n.DabblerLow" },
    "Gambler": { topPick: "gambler.n.GamblerTop", lowPick: "gambler.n.GamblerLow" },
    "Ranger": { topPick: "ranger.n.RangerTop", lowPick: "ranger.n.RangerLow" },
    "Rogue": { topPick: "rogue.n.RogueTop", lowPick: "rogue.n.RogueLow" },
    "Trapper": { topPick: "trapper.n.TrapperTop", lowPick: "trapper.n.TrapperLow" },
    "Spellblade": { topPick: "spellblade.n.SpellbladeTop", lowPick: "spellblade.n.SpellbladeLow" },
    "Ninja": { topPick: "ninja.n.NinjaTop", lowPick: "ninja.n.NinjaLow" },
    "Juggler": { topPick: "juggler.n.JugglerTop", lowPick: "juggler.n.JugglerLow" },
    
    // Tier 2 Rogues
    "Ludus": { topPick: "ludus.n.LudusTop", lowPick: "ludus.n.LudusLow" },
    "Assassin": { topPick: "assassin.n.AssassinTop", lowPick: "assassin.n.AssassinLow" },
    "Dancer": { topPick: "dancer.n.DancerTop", lowPick: "dancer.n.DancerLow" },
    "Fencer": { topPick: "fencer.n.FencerTop", lowPick: "fencer.n.FencerLow" },
    "Sharpshot": { topPick: "sharpshot.n.SharpshotTop", lowPick: "sharpshot.n.SharpshotLow" },
    "Venom": { topPick: "venom.n.VenomTop", lowPick: "venom.n.VenomLow" },
    "Roulette": { topPick: "roulette.n.RouletteTop", lowPick: "roulette.n.RouletteLow" },
    "Dabblest": { topPick: "dabblest.n.DabblestTop", lowPick: "dabblest.n.DabblestLow" },
    "Agent": { topPick: "agent.n.AgentTop", lowPick: "agent.n.AgentLow" },
    
    // Tier 1 Clerics
    "Knight": { topPick: "knight.n.KnightTop", lowPick: "knight.n.KnightLow" },
    "Armorer": { topPick: "armorer.n.ArmorerTop", lowPick: "armorer.n.ArmorerLow" },
    "Bard": { topPick: "bard.n.BardTop", lowPick: "bard.n.BardLow" },
    "Cleric": { topPick: "cleric.n.ClericTop", lowPick: "cleric.n.ClericLow" },
    "Guardian": { topPick: "guardian.n.GuardianTop", lowPick: "guardian.n.GuardianLow" },
    "Pilgrim": { topPick: "pilgrim.n.PilgrimTop", lowPick: "pilgrim.n.PilgrimLow" },
    "Monk": { topPick: "monk.n.MonkTop", lowPick: "monk.n.MonkLow" },
    "Warden": { topPick: "warden.n.WardenTop", lowPick: "warden.n.WardenLow" },
    
    // Tier 2 Clerics
    "Keeper": { topPick: "keeper.n.KeeperTop", lowPick: "keeper.n.KeeperLow" },
    "Paladin": { topPick: "paladin.n.PaladinTop", lowPick: "paladin.n.PaladinLow" },
    "Prince": { topPick: "prince.n.PrinceTop", lowPick: "prince.n.PrinceLow" },
    "Stalwart": { topPick: "stalwart.n.StalwartTop", lowPick: "stalwart.n.StalwartLow" },
    "Poet": { topPick: "poet.n.PoetTop", lowPick: "poet.n.PoetLow" },
    "Valkyrie": { topPick: "valkyrie.n.ValkyrieTop", lowPick: "valkyrie.n.ValkyrieLow" },
    "Stoic": { topPick: "stoic.n.StoicTop", lowPick: "stoic.n.StoicLow" },
    
    // Tier 1 Mages
    "Druid": { topPick: "druid.n.DruidTop", lowPick: "druid.n.DruidLow" },
    "Herbalist": { topPick: "herbalist.n.HerbalistTop", lowPick: "herbalist.n.HerbalistLow" },
    "Medic": { topPick: "medic.n.MedicTop", lowPick: "medic.n.MedicLow" },
    "Priestess": { topPick: "priestess.n.PriestessTop", lowPick: "priestess.n.PriestessLow" },
    "Vampire": { topPick: "vampire.n.VampireTop", lowPick: "vampire.n.VampireLow" },
    "Enchanter": { topPick: "enchanter.n.EnchanterTop", lowPick: "enchanter.n.EnchanterLow" },
    "Disciple": { topPick: "disciple.n.DiscipleTop", lowPick: "disciple.n.DiscipleLow" },
    "Fey": { topPick: "fey.n.FeyTop", lowPick: "fey.n.FeyLow" },
    
    // Tier 2 Mages
    "Doctor": { topPick: "doctor.n.DoctorTop", lowPick: "doctor.n.DoctorLow" },
    "Forsaken": { topPick: "forsaken.n.ForsakenTop", lowPick: "forsaken.n.ForsakenLow" },
    "Prophet": { topPick: "prophet.n.ProphetTop", lowPick: "prophet.n.ProphetLow" },
    "Shaman": { topPick: "shaman.n.ShamanTop", lowPick: "shaman.n.ShamanLow" },
    "Witch": { topPick: "witch.n.WitchTop", lowPick: "witch.n.WitchLow" },
    "Wraith": { topPick: "wraith.n.WraithTop", lowPick: "wraith.n.WraithLow" },
    "Surgeon": { topPick: "surgeon.n.SurgeonTop", lowPick: "surgeon.n.SurgeonLow" },
    "Fate": { topPick: "fate.n.FateTop", lowPick: "fate.n.FateLow" },
    
    // Elemental Mages
    "Fiend": { topPick: "fiend.n.FiendTop", lowPick: "fiend.n.FiendLow" },
    "Jester": { topPick: "jester.n.JesterTop", lowPick: "jester.n.JesterLow" },
    "Sparky": { topPick: "sparky.n.SparkyTop", lowPick: "sparky.n.SparkyLow" },
    "Caldera": { topPick: "caldera.n.CalderaTop", lowPick: "caldera.n.CalderaLow" },
    "Evoker": { topPick: "evoker.n.EvokerTop", lowPick: "evoker.n.EvokerLow" },
    "Glacia": { topPick: "glacia.n.GlaciaTop", lowPick: "glacia.n.GlaciaLow" },
    "Myco": { topPick: "myco.n.MycoTop", lowPick: "myco.n.MycoLow" },
    "Seer": { topPick: "seer.n.SeerTop", lowPick: "seer.n.SeerLow" },
    
    // Advanced Mages
    "Artificer": { topPick: "artificer.n.ArtificerTop", lowPick: "artificer.n.ArtificerLow" },
    "Weaver": { topPick: "weaver.n.WeaverTop", lowPick: "weaver.n.WeaverLow" },
    "Sorcerer": { topPick: "sorcerer.n.SorcererTop", lowPick: "sorcerer.n.SorcererLow" },
    "Chronos": { topPick: "chronos.n.ChronosTop", lowPick: "chronos.n.ChronosLow" },
    "Warlock": { topPick: "warlock.n.WarlockTop", lowPick: "warlock.n.WarlockLow" },
    "Ace": { topPick: "ace.n.AceTop", lowPick: "ace.n.AceLow" },
    "Ghast": { topPick: "ghast.n.GhastTop", lowPick: "ghast.n.GhastLow" },
    "Wizard": { topPick: "wizard.n.WizardTop", lowPick: "wizard.n.WizardLow" },
    
    // Object Heroes
    "Presence": { topPick: "presence.n.PresenceTop", lowPick: "presence.n.PresenceLow" },
    "Spine": { topPick: "spine.n.SpineTop", lowPick: "spine.n.SpineLow" },
    "Granite": { topPick: "granite.n.GraniteTop", lowPick: "granite.n.GraniteLow" },
    "Statue": { topPick: "statue.n.StatueTop", lowPick: "statue.n.StatueLow" },
    "Mimic": { topPick: "mimic.n.MimicTop", lowPick: "mimic.n.MimicLow" },
    "Sphere": { topPick: "sphere.n.SphereTop", lowPick: "sphere.n.SphereLow" },
    "Coffin": { topPick: "coffin.n.CoffinTop", lowPick: "coffin.n.CoffinLow" },
    "Alien": { topPick: "alien.n.AlienTop", lowPick: "alien.n.AlienLow" },
    "Tainted": { topPick: "tainted.n.TaintedTop", lowPick: "tainted.n.TaintedLow" },
    "Luggage": { topPick: "luggage.n.LuggageTop", lowPick: "luggage.n.LuggageLow" },
    "Vessel": { topPick: "vessel.n.VesselTop", lowPick: "vessel.n.VesselLow" },
    "Jumble": { topPick: "jumble.n.JumbleTop", lowPick: "jumble.n.JumbleLow" },
    "Dice": { topPick: "dice.n.DiceTop", lowPick: "dice.n.DiceLow" },
    "Robot": { topPick: "robot.n.RobotTop", lowPick: "robot.n.RobotLow" },
    "Twin": { topPick: "twin.n.TwinTop", lowPick: "twin.n.TwinLow" }
};
