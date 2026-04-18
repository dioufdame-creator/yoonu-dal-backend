from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_tontines_phase1'),
    ]

    operations = [
        migrations.AddField(
            model_name='tontine',
            name='payout_mode',
            field=models.CharField(
                max_length=10,
                choices=[('manual', 'Manuel'), ('random', 'Aléatoire')],
                default='manual',
                help_text="Manuel = admin définit l'ordre. Aléatoire = tirage mensuel."
            ),
        ),
        migrations.AddField(
            model_name='tontine',
            name='current_payout_month',
            field=models.IntegerField(
                default=0,
                help_text="Dernier mois pour lequel un tirage a été effectué"
            ),
        ),
    ]
