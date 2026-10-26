// Macroeconomics —6: The open economy in the long run.
import {lesson1,lesson2,lesson3,lesson4,lesson5,lesson6,lesson7} from './ch06.viz.js';
export default {
 collection:'macro',chapter:6,title:'The open economy in the long run',
 summary:String.raw`An open economy can invest more or less than it saves; its accounts identify the matching external transactions. A consistent exchange-rate quote connects currency conversion, relative prices and conditional expected returns. Observed burger prices, risky carry payoffs and a two-sector productivity model show why purchasing-power parity, uncovered parity and income–price patterns need careful interpretation.`,
 items:[
 {
  num:'6.1',kind:'Definition',name:'Current account, capital flows and the balance of payments',deps:['macro-1.5'],
  statement:String.raw`The **current account** records net exports of goods and services, net primary income from abroad and net secondary income. Write these as $NX$, $NPI$ and $NSI$. Gross national disposable income is $Y+NPI+NSI$, so national saving gives
$$CA=NX+NPI+NSI,$$
$$S-I=CA.$$
Here the financial account $FA$ means **net acquisition of foreign assets minus net incurrence of foreign liabilities**. With capital-account balance $KA$ and complete consistent recording,
$$CA+KA-FA=0.$$
A positive $FA$ is net financial outflow under this convention. A change in net international investment position also includes valuation and other stock adjustments; it is not generally the financial-account flow alone.`,
  idea:String.raw`The saving rearrangement in macro-1.5 omitted net cross-border income. Adding primary and secondary income to disposable resources produces the more general current-account identity. Every external transaction has a counterpart, but the sign assigned to a financial-account balance depends on the stated convention: the RBA explainer instead uses an inflow-positive presentation. The recording experiment deliberately omits a known fraction of this teaching economy’s financial flow; a real statistical discrepancy would require investigation rather than this automatic diagnosis.`,
  scope:'One chosen accounting period, common model-money units and saving defined from gross national disposable income. The displayed financial convention is assets acquired minus liabilities incurred. Gross offsetting financial flows are authored. The NIIP panel has an explicit opening stock and chosen valuation change; other volume adjustments are zero. No accounting identity by itself determines a causal fiscal or exchange-rate response.',
  caption:'Change domestic spending, cross-border income and the capital account. Follow saving minus investment into the actual net financial flow, then compare transactions with the separate valuation change in the closing external stock. Omit part of the recorded flow to expose a statistical residual.',
  refs:['Reserve Bank of Australia, The Balance of Payments; complete visible explainer and both diagrams read; declared financial-sign conversion','Own national-disposable-income and stock-flow accounting'],
  tags:['external-accounts','capital-flows'],links:{'RBA · balance of payments':'https://www.rba.gov.au/education/resources/explainers/the-balance-of-payments.html'},viz:lesson1,
 },
 {
  num:'6.2',kind:'Definition',name:'Nominal and real exchange rates',deps:['macro-6.1'],
  statement:String.raw`Let $S$ be domestic currency units per foreign currency unit. A rise in $S$ is domestic **nominal depreciation**. If a domestic basket costs $P$ domestically and a comparable foreign basket costs $P^*$ abroad, the relative foreign-basket cost is
$$q=\frac{SP^*}{P}.$$
Thus a fall in $q$ is domestic **real appreciation**. With constant continuous nominal depreciation $g_S$, domestic inflation $\pi$ and foreign inflation $\pi^*$,
$$\log\frac{q_t}{q_0}=(g_S+\pi^*-\pi)t.$$
Nominal appreciation and real appreciation need not coincide when the price levels move differently.`,
  idea:String.raw`First convert the foreign price into domestic currency, $SP^*$; only then compare it with the domestic price. Taking logs separates nominal conversion from the two price changes. The chosen paths exponentiate those declared growth rates and compute the baskets at the selected time. A tiny positive or negative real change is retained from the original factors even when the final level rounds back to its initial displayed number.`,
  scope:'Domestic-per-foreign quote throughout, comparable specified baskets and chosen constant continuous growth rates over a finite horizon. The paths are synthetic, not historical observations. A CPI index ratio can describe changes relative to a base date, but arbitrary index normalizations alone cannot establish absolute purchasing-power parity. Real appreciation is a relative-price description, not a prediction of welfare or net exports.',
  caption:'Change the nominal quote and the two basket prices, then vary inflation and nominal depreciation. Compare converted basket costs, normalized nominal and real paths, and the signed contributions to the log change in the real exchange rate.',
  refs:['Reserve Bank of Australia, Exchange Rates and their Measurement; complete visible text and original Australian-dollar graph read','Own consistently quoted basket conversion and continuous-growth example'],
  tags:['exchange-rates','relative-prices'],links:{'RBA · exchange-rate measurement':'https://www.rba.gov.au/education/resources/explainers/exchange-rates-and-their-measurement.html'},viz:lesson2,
 },
 {
  num:'6.3',kind:'Hypothesis',name:'Purchasing-power parity',deps:['macro-6.2'],
  statement:String.raw`**Absolute purchasing-power parity** would make comparable baskets cost the same after currency conversion:
$$SP^*=P,\qquad q=1.$$
Relative PPP instead predicts exchange-rate changes that offset relative inflation, under its basket and measurement assumptions. These are hypotheses about prices and exchange rates, not accounting identities.

The observed Big Mac comparison prices one product. For a local burger price $P_B$, US burger price $P_{US}$ and local-currency-per-dollar market rate $S$, its raw dollar-price deviation is
$$d_B=\frac{P_B/S}{P_{US}}-1.$$
This product-price deviation is not a full CPI real exchange rate or definitive evidence of currency mispricing.`,
  idea:String.raw`If the same tradable good could be moved and resold without costs, price gaps would create an arbitrage incentive. Burgers include local services, wages, rents and taxes, and baskets can differ in composition and quality, so that argument does not force their international prices to coincide. The visualization recomputes actual price deviations from a fixed, complete source cohort. It shows observations rather than fitting an unverified convergence law.`,
  scope:'The Economist’s fixed price-only sample: Australia, Britain, Japan, Switzerland and the United States, nine observation dates from July 2022 through July 2026, acquired 26 October 2026. July 2022 begins the source’s revised US-price methodology. Source-generated data are attributed under CC BY 4.0; GDP_bigmac and GDP-adjusted indices are excluded. Lines, where used, only guide the eye between observed points; no interpolation, live feed, convergence estimate or investment implication.',
  caption:'Choose a country and observation date. Compare same-date dollar burger prices or raw deviations, then follow the nine actual observations for the fixed country cohort. The selected conversion shows both the market rate and the burger-implied parity rate.',
  refs:['The Economist, Big Mac index official public price data and README, acquired 2026-10-26; 45 selected original rows read; Economist-generated data CC BY 4.0','RBA, Exchange Rates and their Measurement, purchasing-power-parity discussion'],
  tags:['purchasing-power-parity','observed-prices'],links:{'The Economist · data and methodology':'https://github.com/TheEconomist/big-mac-data','CC BY 4.0 · data attribution':'https://creativecommons.org/licenses/by/4.0/'},viz:lesson3,
 },
 {
  num:'6.4',kind:'Theorem',name:'Uncovered interest parity',deps:['fin-6.5','macro-6.2'],
  statement:String.raw`Consider one domestic unit invested for $T$ with deterministic continuous rates $r_d,r_f$ and spot quote $S_0$ in domestic per foreign currency. A foreign deposit converted at its uncertain terminal spot $S_T$ pays $e^{r_fT}S_T/S_0$ domestically. If investors equate the two **expected domestic payoffs**, then
$$\mathbb E[S_T]=S_0e^{(r_d-r_f)T}.$$
This is a conditional uncovered-parity statement. Unlike the covered route in fin-6.5, its realized foreign payoff remains exposed to exchange risk. It also does not imply the exact equality $\mathbb E[\log(S_T/S_0)]=(r_d-r_f)T$ when exchange rates are uncertain.`,
  idea:String.raw`Set the home payoff $e^{r_dT}$ equal to the expected foreign payoff and rearrange. The equality needs a risk-neutral expected-return condition or an equivalent restriction on the risk premium; certain-payoff arbitrage alone does not supply it. In the chosen two equally likely states, terminal spots are the declared mean times $1-\sigma$ and $1+\sigma$. Their arithmetic mean is unchanged as risk rises, while their expected log change is reduced by the Jensen term $-\tfrac12\log(1-\sigma^2)$.`,
  scope:'One maturity; deterministic continuous deposit rates; frictionless conversion and equal access; positive terminal spots and finite expectations. The parity equality additionally assumes risk neutrality or no relevant expected-payoff risk premium. The authored two-state mean may include an explicit log-rate wedge; it is not a forecast. The distribution is specified separately for each positive chosen maturity, not derived as a full multi-period stochastic process; at zero maturity both states collapse to the current spot. No riskless-profit or causal exchange-rate claim.',
  caption:'Compare the home deposit with both possible foreign payoffs. Change rates, maturity and currency dispersion while watching the arithmetic expectation and log expectation separately. Add an expected-return wedge to break the conditional parity equality.',
  refs:['Michele Cavallo, FRBSF Economic Letter 2006-31, 17 November 2006, complete actual body and references read; covered/uncovered parity discussion','Own continuous-rate expected-payoff derivation and positive two-state example'],
  tags:['interest-parity','currency-risk'],links:{'FRBSF · parity and carry trade':'https://www.frbsf.org/research-and-insights/publications/economic-letter/2006/11/interest-rates-carry-trades-and-exchange-rate-movements/'},viz:lesson4,
 },
 {
  num:'6.5',kind:'Phenomenon',name:'The forward-premium puzzle and the carry trade',deps:['macro-6.4'],
  statement:String.raw`The **forward-premium puzzle** is the historically documented failure, in studied samples, of high-interest currencies to depreciate as the usual uncovered-parity prediction suggests. A carry trade borrows in a low-rate funding currency and invests in a higher-rate target currency; exchange losses can offset the interest gain. Cavallo’s 2006 account reports this empirical puzzle and emphasizes currency risk, costs and limited evidence on trading scale.

The visualization uses a separate authored one-year economy: funding rate zero, target continuous rate $r>0$, terminal spot ratio $1$ normally and $h\in(0,1)$ in a crash of probability $p$. Net payoffs per funding unit are
$$g_N=e^r-1,\qquad g_C=he^r-1.$$
The expected payoff is $(1-p)g_N+pg_C$, which can be negative despite repeated positive normal outcomes.`,
  idea:String.raw`Start from the risky foreign payoff in6.4 and subtract the funding obligation. In this example the expected net payoff is $[1-p(1-h)]e^r-1$; its zero occurs at $p^*=(1-e^{-r})/(1-h)$. A plotted schedule deliberately places one crash among twenty repeated one-unit notionals. Its cumulative sum is a chosen illustration, not an empirical sample, a random draw from $p$ or compounded wealth. The historical puzzle statement comes from the identified source rather than that constructed path.`,
  scope:'Historical evidence is attributed to Cavallo’s 17 November 2006 secondary account; its cited original research was not read. No historical regression, portfolio estimate, contemporary anomaly or persistent-profit forecast is reconstructed. The chosen annual risk economy has no transaction costs, leverage constraints or changing funding rate. A zero-cost trade payoff and a cumulative fixed-notional payoff sum are distinguished from percentage returns on invested capital and compounded wealth.',
  caption:'Change the target rate, crash severity and probability. Compare both outcome payoffs with their actual probability-weighted expectation and fair crash probability. Move the one authored crash, or remove it, to see why a pleasing cumulative path does not establish the expected payoff.',
  refs:['Michele Cavallo, Interest Rates, Carry Trades, and Exchange Rate Movements, FRBSF Economic Letter 2006-31, 17 November 2006; complete body/refs read; cited originals unread','Own explicitly constructed finite risk/payoff economy; no empirical regression'],
  tags:['carry-trade','expected-returns'],links:{'Cavallo 2006 · historical account':'https://www.frbsf.org/research-and-insights/publications/economic-letter/2006/11/interest-rates-carry-trades-and-exchange-rate-movements/'},viz:lesson5,
 },
 {
  num:'6.6',kind:'Model',name:'The small open economy with perfect capital mobility',deps:['macro-6.1','macro-2.3'],
  statement:String.raw`In a full-employment **small open economy** with perfect capital mobility and no country-risk wedge, the world real rate fixes the domestic rate. Investment therefore need not adjust to domestic saving:
$$r=r^*_{world},\qquad NX=S-I(r).$$
With net foreign income and capital transfers zero, a fiscal expansion that reduces saving while leaving investment demand and the world rate fixed reduces net exports. If net exports rise with the real exchange rate $q=SP^*/P$, the required adjustment is real appreciation, a fall in $q$.

The chosen closure is $I=40-100r$, $S=50-\Delta G$ and $NX=\eta\log q$, with $\eta>0$. Hence $q=\exp[(S-I)/\eta]$ is always positive.`,
  idea:String.raw`The closed-economy loanable-funds model in macro-2.3 adjusts the interest rate until saving equals investment. Here the external funding margin absorbs the gap at the given world rate. Combining that gap with a specified net-export schedule locates the relative price. The identity in6.1 supplies the accounting restriction; the world-rate, saving and export equations supply the causal closure. Different closures or risk wedges need not give this comparative static.`,
  scope:'A hypothetical long-run full-employment economy, fixed world real rate, perfect capital mobility, unchanged investment schedule, constant consumption and an explicit log net-export schedule. GDP is 200 model units, initial government purchases 30 and consumption 120; primary/secondary income and capital transfers are zero. Fiscal expansion is not asserted to have this effect in every actual economy or in a short-run sticky-price model.',
  caption:'Raise government purchases while the world rate is fixed. Follow the saving–investment gap into net exports and the real-rate intersection; compare the entire fiscal-shift traces to see which quantities move. Changing the world rate is a separate experiment.',
  refs:['RBA, The Balance of Payments, current-account and financial-counterpart concepts','Actual written macro-1.5 and macro-2.3 prerequisites; own complete small-open-economy closure'],
  tags:['small-open-economy','fiscal-policy'],links:{'RBA · external accounts':'https://www.rba.gov.au/education/resources/explainers/the-balance-of-payments.html'},viz:lesson6,
 },
 {
  num:'6.7',kind:'Phenomenon',name:'The Balassa–Samuelson effect',deps:['macro-6.3'],
  statement:String.raw`The **Balassa–Samuelson channel** links relative sector productivity to nontraded prices under particular wage and tradable-price assumptions. Consider a competitive labour-only economy with traded price normalized to 1, traded/nontraded productivities $a_T,a_N>0$ and a common wage. Then
$$w=a_T,\qquad P_N=\frac{a_T}{a_N}.$$
For a normalized Cobb–Douglas consumption composite with traded expenditure share $\alpha\in(0,1)$, its unit expenditure cost is
$$P=P_N^{1-\alpha}.$$
Against a fixed foreign index 1 and nominal rate 1, the real rate is $q=1/P$ and real labour income is $w/P$. Holding $a_N$ fixed, higher $a_T$ raises nontraded prices and appreciates the real rate.`,
  idea:String.raw`Tradable-price competition and labour productivity determine the wage in the traded sector. Labour mobility carries that wage into services, so producing one nontraded unit costs $w/a_N$. Define the composite as $(C_T/\alpha)^\alpha(C_N/(1-\alpha))^{1-\alpha}$, which makes its unit expenditure cost $P_T^\alpha P_N^{1-\alpha}$. Here real income equals $a_T^\alpha a_N^{1-\alpha}$: raising nontraded productivity can increase income while lowering the price index, so this channel does not establish a universal causal income–price relationship.`,
  scope:'Own labour-only two-sector model with perfect competition, common wages, equal unit labour-cost pricing, traded price and nominal rate 1, fixed foreign productivities/index 1 and a normalized Cobb–Douglas composite. Households spend share alpha on traded goods. The CNB Inflation Report II/2002 attachment supplies a conditional historical sector-productivity account; its old assumed numerical scenario is not a 2026 estimate. The plotted price–income locus is hypothetical, not cross-country GDP data.',
  caption:'Change traded and nontraded productivity separately. Follow the common wage into the service price and composite cost, check the expenditure/resource accounting, and compare the hypothetical price–income loci for the two distinct productivity channels.',
  refs:['Czech National Bank, Inflation Report II/2002 attachment The Balassa–Samuelson effect; complete actual visible body/equations read','Own normalized competitive two-sector labour economy; no GDP_bigmac regression'],
  tags:['sector-productivity','relative-prices'],links:{'CNB 2002 · conditional productivity channel':'https://www.cnb.cz/en/monetary-policy/inflation-reports/boxes-and-annexes-contained-in-inflation-reports/The-Balassa-Samuelson-effect-00001'},viz:lesson7,
 },
 ],
};
