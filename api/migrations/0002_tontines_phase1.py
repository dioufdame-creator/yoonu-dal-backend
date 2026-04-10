# Generated manually for Tontines Phase 1

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tontineparticipant',
            name='payout_month',
            field=models.IntegerField(blank=True, help_text='Mois de paiement (1-12)', null=True),
        ),
        migrations.AddField(
            model_name='tontineparticipant',
            name='is_paid',
            field=models.BooleanField(default=False, help_text='A reçu son paiement'),
        ),
        migrations.AddField(
            model_name='tontineparticipant',
            name='paid_at',
            field=models.DateTimeField(blank=True, help_text='Date du paiement', null=True),
        ),
        migrations.AddField(
            model_name='tontinecontribution',
            name='status',
            field=models.CharField(choices=[('pending', 'En attente'), ('confirmed', 'Confirmée'), ('rejected', 'Rejetée')], default='pending', max_length=20),
        ),
        migrations.AddField(
            model_name='tontinecontribution',
            name='rejection_reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='TontineActivity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('activity_type', models.CharField(choices=[('join', 'Nouveau participant'), ('contribution', 'Contribution'), ('payout', 'Paiement reçu'), ('order_change', 'Ordre modifié'), ('validation', 'Contribution validée'), ('rejection', 'Contribution rejetée')], max_length=20)),
                ('amount', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('message', models.TextField(help_text="Message descriptif de l'activité")),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('participant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.tontineparticipant')),
                ('tontine', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='activities', to='api.tontine')),
            ],
            options={
                'verbose_name': 'Activité tontine',
                'verbose_name_plural': 'Activités tontines',
                'ordering': ['-created_at'],
            },
        ),
    ]
